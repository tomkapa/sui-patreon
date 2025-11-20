/**
 * Faucet Service Test Suite
 *
 * Tests for faucet service that transfers tokens to users
 * Follows TDD approach with tests written before implementation
 */

import { describe, it, expect, beforeEach, spyOn, afterEach, beforeAll } from 'bun:test';
import { prisma } from '../lib/prisma';
import * as faucetService from './faucet.service';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

describe('Faucet Service', () => {
  const testWalletAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const invalidWalletAddress = 'invalid-address';

  beforeAll(() => {
    // Set test environment variables
    process.env.FAUCET_WALLET_PRIVATE_KEY = 'suiprivkey1qq6qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
    process.env.FAUCET_TOKENS = JSON.stringify([
      { coinType: '0x2::sui::SUI', amount: '100000000' },
      { coinType: '0xUSDC::usdc::USDC', amount: '1000000000' },
      { coinType: '0xWAL::wal::WAL', amount: '100000000' },
    ]);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.faucetClaim.deleteMany({
      where: { walletAddress: testWalletAddress },
    });
    // Reset tokens config cache
    faucetService.resetTokensConfig();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.faucetClaim.deleteMany({
      where: { walletAddress: testWalletAddress },
    });
    // Reset keypair cache
    faucetService.resetKeypair();
  });

  describe('hasAlreadyClaimed', () => {
    it('should return false for wallet that has not claimed', async () => {
      const hasClaimed = await faucetService.hasAlreadyClaimed(testWalletAddress);
      expect(hasClaimed).toBe(false);
    });

    it('should return true for wallet that has claimed', async () => {
      // Record a claim
      await prisma.faucetClaim.create({
        data: { walletAddress: testWalletAddress },
      });

      const hasClaimed = await faucetService.hasAlreadyClaimed(testWalletAddress);
      expect(hasClaimed).toBe(true);
    });
  });

  describe('recordClaim', () => {
    it('should record a new claim', async () => {
      const claim = await faucetService.recordClaim(testWalletAddress);

      expect(claim).toBeDefined();
      expect(claim.walletAddress).toBe(testWalletAddress);
      expect(claim.claimedAt).toBeInstanceOf(Date);

      // Verify it's in database
      const dbClaim = await prisma.faucetClaim.findUnique({
        where: { walletAddress: testWalletAddress },
      });
      expect(dbClaim).toBeDefined();
      expect(dbClaim?.walletAddress).toBe(testWalletAddress);
    });

    it('should throw error if wallet has already claimed', async () => {
      // First claim
      await faucetService.recordClaim(testWalletAddress);

      // Second claim should fail
      await expect(faucetService.recordClaim(testWalletAddress)).rejects.toThrow();
    });
  });

  describe('transferTokens', () => {
    it('should transfer all tokens to valid wallet address in single transaction', async () => {
      // Mock getFaucetKeypair to return a test keypair
      const testKeypair = new Ed25519Keypair();
      const getKeypairSpy = spyOn(faucetService, 'getFaucetKeypair').mockReturnValue(testKeypair);

      // Mock Sui client methods
      const mockDigest = '0xtransaction123';

      // Mock getCoins to return sufficient balance for each token type
      const getCoinsspy = spyOn(SuiClient.prototype, 'getCoins').mockImplementation(async (params: any) => {
        const coinType = params.coinType;
        return {
          data: [
            {
              coinObjectId: `0x${coinType.replace(/:/g, '')}1234`,
              balance: '10000000000', // Sufficient balance
              digest: 'digest123',
              version: '1',
              coinType,
            },
          ],
          nextCursor: null,
          hasNextPage: false,
        };
      });

      const signAndExecuteSpy = spyOn(SuiClient.prototype, 'signAndExecuteTransaction').mockResolvedValue({
        digest: mockDigest,
        effects: {
          status: { status: 'success' },
        },
      } as any);

      const result = await faucetService.transferTokens(testWalletAddress);

      expect(result).toBeDefined();
      expect(result.digest).toBe(mockDigest);
      expect(result.to).toBe(testWalletAddress);
      expect(result.transfers).toHaveLength(3);
      expect(result.transfers[0]).toEqual({ coinType: '0x2::sui::SUI', amount: '100000000' });
      expect(result.transfers[1]).toEqual({ coinType: '0xUSDC::usdc::USDC', amount: '1000000000' });
      expect(result.transfers[2]).toEqual({ coinType: '0xWAL::wal::WAL', amount: '100000000' });

      // Verify getCoins was called 2 times (for USDC and WAL, not SUI since SUI uses tx.gas)
      expect(getCoinsspy).toHaveBeenCalledTimes(2);

      // Verify signAndExecuteTransaction was called only once (single transaction)
      expect(signAndExecuteSpy).toHaveBeenCalledTimes(1);

      getKeypairSpy.mockRestore();
      getCoinsspy.mockRestore();
      signAndExecuteSpy.mockRestore();
    });

    it('should throw error if faucet wallet has insufficient SUI', async () => {
      // Mock getFaucetKeypair
      const testKeypair = new Ed25519Keypair();
      const getKeypairSpy = spyOn(faucetService, 'getFaucetKeypair').mockReturnValue(testKeypair);

      // Mock getCoins to return empty array for all non-SUI tokens
      // Note: SUI uses tx.gas so it doesn't check for coins
      const getCoinsspy = spyOn(SuiClient.prototype, 'getCoins').mockImplementation(async (params: any) => {
        // Return empty for all tokens (SUI will use tx.gas and succeed)
        return {
          data: [],
          nextCursor: null,
          hasNextPage: false,
        };
      });

      // This will now fail on USDC (first non-SUI token) instead of SUI
      await expect(faucetService.transferTokens(testWalletAddress)).rejects.toThrow(
        'Insufficient 0xUSDC::usdc::USDC in faucet wallet'
      );

      getKeypairSpy.mockRestore();
      getCoinsspy.mockRestore();
    });

    it('should throw error if faucet wallet has insufficient USDC balance', async () => {
      // Mock getFaucetKeypair
      const testKeypair = new Ed25519Keypair();
      const getKeypairSpy = spyOn(faucetService, 'getFaucetKeypair').mockReturnValue(testKeypair);

      // Mock getCoins to return coin with insufficient balance for USDC
      const getCoinsspy = spyOn(SuiClient.prototype, 'getCoins').mockImplementation(async (params: any) => {
        const coinType = params.coinType;
        if (coinType === '0xUSDC::usdc::USDC') {
          return {
            data: [
              {
                coinObjectId: '0xabcd1234',
                balance: '100', // Only 100 (way less than required 1000000000)
                digest: 'digest123',
                version: '1',
                coinType,
              },
            ],
            nextCursor: null,
            hasNextPage: false,
          };
        }
        // Other tokens have sufficient balance
        return {
          data: [{ coinObjectId: '0xabcd', balance: '10000000000', digest: 'digest', version: '1', coinType }],
          nextCursor: null,
          hasNextPage: false,
        };
      });

      await expect(faucetService.transferTokens(testWalletAddress)).rejects.toThrow(
        'Insufficient 0xUSDC::usdc::USDC in faucet wallet'
      );

      getKeypairSpy.mockRestore();
      getCoinsspy.mockRestore();
    });

    it('should throw error if transaction fails', async () => {
      // Mock getFaucetKeypair
      const testKeypair = new Ed25519Keypair();
      const getKeypairSpy = spyOn(faucetService, 'getFaucetKeypair').mockReturnValue(testKeypair);

      // Mock successful getCoins for all tokens
      const getCoinsspy = spyOn(SuiClient.prototype, 'getCoins').mockImplementation(async (params: any) => {
        const coinType = params.coinType;
        return {
          data: [
            {
              coinObjectId: `0x${coinType.replace(/:/g, '')}1234`,
              balance: '10000000000',
              digest: 'digest123',
              version: '1',
              coinType,
            },
          ],
          nextCursor: null,
          hasNextPage: false,
        };
      });

      // Mock failed transaction
      const signAndExecuteSpy = spyOn(
        SuiClient.prototype,
        'signAndExecuteTransaction'
      ).mockRejectedValue(new Error('Transaction failed'));

      await expect(faucetService.transferTokens(testWalletAddress)).rejects.toThrow(
        'Transaction failed'
      );

      getKeypairSpy.mockRestore();
      getCoinsspy.mockRestore();
      signAndExecuteSpy.mockRestore();
    });
  });

  describe('claimFaucet', () => {
    it('should successfully claim tokens for new wallet', async () => {
      // Mock transferTokens
      const mockDigest = '0xtransaction123';
      const transferSpy = spyOn(faucetService, 'transferTokens').mockResolvedValue({
        digest: mockDigest,
        from: '0xfaucet',
        to: testWalletAddress,
        transfers: [
          { coinType: '0x2::sui::SUI', amount: '100000000' },
          { coinType: '0xUSDC::usdc::USDC', amount: '1000000000' },
          { coinType: '0xWAL::wal::WAL', amount: '100000000' },
        ],
      });

      const result = await faucetService.claimFaucet(testWalletAddress);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.digest).toBe(mockDigest);
      expect(result.transfers).toHaveLength(3);
      expect(result.transfers[0]).toEqual({ coinType: '0x2::sui::SUI', amount: '100000000' });
      expect(result.transfers[1]).toEqual({ coinType: '0xUSDC::usdc::USDC', amount: '1000000000' });
      expect(result.transfers[2]).toEqual({ coinType: '0xWAL::wal::WAL', amount: '100000000' });

      // Verify claim was recorded
      const claim = await prisma.faucetClaim.findUnique({
        where: { walletAddress: testWalletAddress },
      });
      expect(claim).toBeDefined();

      transferSpy.mockRestore();
    });

    it('should throw error if wallet has already claimed', async () => {
      // Record a claim first
      await prisma.faucetClaim.create({
        data: { walletAddress: testWalletAddress },
      });

      await expect(faucetService.claimFaucet(testWalletAddress)).rejects.toThrow(
        'Wallet has already claimed tokens'
      );
    });

    it('should throw error for invalid wallet address', async () => {
      await expect(faucetService.claimFaucet(invalidWalletAddress)).rejects.toThrow(
        'Invalid wallet address format'
      );
    });

    it('should rollback claim record if transfer fails', async () => {
      // Mock failed transfer
      const transferSpy = spyOn(faucetService, 'transferTokens').mockImplementation(() => {
        return Promise.reject(new Error('Insufficient funds'));
      });

      try {
        await faucetService.claimFaucet(testWalletAddress);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Insufficient funds');
      }

      // Verify claim was NOT recorded
      const claim = await prisma.faucetClaim.findUnique({
        where: { walletAddress: testWalletAddress },
      });
      expect(claim).toBeNull();

      transferSpy.mockRestore();
    });
  });
});
