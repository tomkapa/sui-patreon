/**
 * Faucet Routes Test Suite
 *
 * Tests for POST /api/faucet endpoint
 * Follows TDD approach with comprehensive test coverage
 */

import { describe, it, expect, beforeEach, spyOn, afterEach } from 'bun:test';
import request from 'supertest';
import express from 'express';
import faucetRouter from './faucet';
import * as faucetService from '../services/faucet.service';
import { prisma } from '../lib/prisma';

// Create a test app for isolated testing
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/api/faucet', faucetRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

describe('Faucet Routes', () => {
  const testWalletAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const invalidWalletAddress = 'invalid-address';

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.faucetClaim.deleteMany({
      where: { walletAddress: testWalletAddress },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.faucetClaim.deleteMany({
      where: { walletAddress: testWalletAddress },
    });
  });

  describe('POST /api/faucet', () => {
    it('should successfully claim tokens for valid wallet address', async () => {
      // Mock claimFaucet service
      const mockClaimResult = {
        success: true,
        digest: '0xtransaction123',
        transfers: [
          { coinType: '0x2::sui::SUI', amount: '100000000' },
          { coinType: '0xUSDC::usdc::USDC', amount: '1000000000' },
          { coinType: '0xWAL::wal::WAL', amount: '100000000' },
        ],
      };

      const claimSpy = spyOn(faucetService, 'claimFaucet').mockResolvedValue(mockClaimResult);

      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: testWalletAddress })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        digest: '0xtransaction123',
        transfers: [
          { coinType: '0x2::sui::SUI', amount: '100000000' },
          { coinType: '0xUSDC::usdc::USDC', amount: '1000000000' },
          { coinType: '0xWAL::wal::WAL', amount: '100000000' },
        ],
      });

      // Verify claimFaucet was called with correct address
      expect(claimSpy).toHaveBeenCalledWith(testWalletAddress);

      claimSpy.mockRestore();
    });

    it('should return 400 for invalid wallet address format', async () => {
      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: invalidWalletAddress })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid wallet address format',
      });
    });

    it('should return 400 if wallet has already claimed', async () => {
      // Mock claimFaucet to throw "already claimed" error
      const claimSpy = spyOn(faucetService, 'claimFaucet').mockImplementation(() => {
        return Promise.reject(new Error('Wallet has already claimed tokens'));
      });

      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: testWalletAddress })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Wallet has already claimed tokens',
      });

      claimSpy.mockRestore();
    });

    it('should return 500 if faucet wallet has insufficient funds', async () => {
      // Mock claimFaucet to throw "insufficient funds" error
      const claimSpy = spyOn(faucetService, 'claimFaucet').mockImplementation(() => {
        return Promise.reject(new Error('Faucet wallet has insufficient funds'));
      });

      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: testWalletAddress })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Faucet wallet has insufficient funds',
      });

      claimSpy.mockRestore();
    });

    it('should return 500 with specific token type if insufficient balance for that token', async () => {
      // Mock claimFaucet to throw specific token error
      const claimSpy = spyOn(faucetService, 'claimFaucet').mockImplementation(() => {
        return Promise.reject(new Error('Insufficient 0xUSDC::usdc::USDC in faucet wallet'));
      });

      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: testWalletAddress })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Insufficient 0xUSDC::usdc::USDC in faucet wallet',
      });

      claimSpy.mockRestore();
    });

    it('should return 500 if transaction fails', async () => {
      // Mock claimFaucet to throw transaction error
      const claimSpy = spyOn(faucetService, 'claimFaucet').mockImplementation(() => {
        return Promise.reject(new Error('Transaction failed'));
      });

      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: testWalletAddress })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Transaction failed',
      });

      claimSpy.mockRestore();
    });

    it('should return 400 if walletAddress is missing', async () => {
      const response = await request(app)
        .post('/api/faucet')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Wallet address is required',
      });
    });

    it('should return 400 if walletAddress is not a string', async () => {
      const response = await request(app)
        .post('/api/faucet')
        .send({ walletAddress: 12345 })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Wallet address must be a string',
      });
    });
  });
});
