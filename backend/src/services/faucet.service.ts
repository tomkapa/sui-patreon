/**
 * Faucet Service
 *
 * Handles token distribution from faucet wallet to user wallets.
 * Implements single-claim enforcement and Sui blockchain integration.
 */

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { prisma } from '../lib/prisma';
import { isValidSuiAddress } from '../lib/validation';

/**
 * Token configuration interface
 */
export interface TokenConfig {
  coinType: string;
  amount: string;
}

/**
 * Faucet configuration from environment variables
 */
const FAUCET_CONFIG = {
  PRIVATE_KEY: process.env.FAUCET_WALLET_PRIVATE_KEY || '',
  NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet',
};

/**
 * Parse and validate FAUCET_TOKENS environment variable
 * @returns Array of token configurations
 * @throws Error if JSON is invalid or missing required fields
 */
function parseTokensConfig(): TokenConfig[] {
  const tokensJson = process.env.FAUCET_TOKENS;

  if (!tokensJson) {
    throw new Error('FAUCET_TOKENS environment variable not set');
  }

  try {
    const tokens = JSON.parse(tokensJson);

    if (!Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('FAUCET_TOKENS must be a non-empty array');
    }

    // Validate each token config
    for (const token of tokens) {
      if (!token.coinType || typeof token.coinType !== 'string') {
        throw new Error('Each token must have a valid coinType string');
      }
      if (!token.amount || typeof token.amount !== 'string') {
        throw new Error('Each token must have a valid amount string');
      }
      // Validate amount is a valid number
      if (isNaN(Number(token.amount)) || BigInt(token.amount) <= 0n) {
        throw new Error(`Invalid amount for ${token.coinType}: ${token.amount}`);
      }
    }

    return tokens as TokenConfig[];
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in FAUCET_TOKENS: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get token configurations (cached)
 */
let cachedTokensConfig: TokenConfig[] | null = null;

function getTokensConfig(): TokenConfig[] {
  if (!cachedTokensConfig) {
    cachedTokensConfig = parseTokensConfig();
  }
  return cachedTokensConfig;
}

/**
 * Reset tokens config (for testing purposes)
 */
export function resetTokensConfig(): void {
  cachedTokensConfig = null;
}

/**
 * Initialize Sui client for faucet operations
 */
const suiClient = new SuiClient({
  url: getFullnodeUrl(FAUCET_CONFIG.NETWORK),
});

/**
 * Initialize faucet keypair from environment variable
 */
let faucetKeypair: Ed25519Keypair | null = null;

/**
 * Get or create faucet keypair (lazy initialization)
 * Exported for testing purposes to allow mocking
 */
export function getFaucetKeypair(): Ed25519Keypair {
  if (!faucetKeypair) {
    if (!FAUCET_CONFIG.PRIVATE_KEY) {
      throw new Error('FAUCET_WALLET_PRIVATE_KEY environment variable not set');
    }

    try {
      faucetKeypair = Ed25519Keypair.fromSecretKey(FAUCET_CONFIG.PRIVATE_KEY);
    } catch (error) {
      throw new Error('Invalid FAUCET_WALLET_PRIVATE_KEY format');
    }
  }

  return faucetKeypair;
}

/**
 * Reset keypair (for testing purposes)
 */
export function resetKeypair(): void {
  faucetKeypair = null;
}

/**
 * Single token transfer info
 */
export interface TokenTransfer {
  coinType: string;
  amount: string;
}

/**
 * Transfer result interface
 */
export interface TransferResult {
  digest: string;
  from: string;
  to: string;
  transfers: TokenTransfer[];
}

/**
 * Claim result interface
 */
export interface ClaimResult {
  success: boolean;
  digest: string;
  transfers: TokenTransfer[];
}

/**
 * Check if a wallet address has already claimed from the faucet
 *
 * @param walletAddress - Sui wallet address to check
 * @returns True if wallet has claimed, false otherwise
 */
export async function hasAlreadyClaimed(walletAddress: string): Promise<boolean> {
  const claim = await prisma.faucetClaim.findUnique({
    where: { walletAddress },
  });

  return claim !== null;
}

/**
 * Record a faucet claim in the database
 *
 * @param walletAddress - Sui wallet address that claimed
 * @returns Created FaucetClaim record
 * @throws Error if wallet has already claimed
 */
export async function recordClaim(walletAddress: string) {
  try {
    return await prisma.faucetClaim.create({
      data: { walletAddress },
    });
  } catch (error) {
    // Prisma unique constraint violation
    throw new Error('Wallet has already claimed tokens');
  }
}

/**
 * Get coins by type for a specific wallet
 * @param owner - Wallet address
 * @param coinType - Full coin type
 * @returns Array of coin objects with balances
 */
async function getCoinsByType(owner: string, coinType: string) {
  const coins = await suiClient.getCoins({
    owner,
    coinType,
  });

  return coins.data.map((coin) => ({
    objectId: coin.coinObjectId,
    balance: BigInt(coin.balance),
  }));
}

/**
 * Transfer multiple tokens from faucet wallet to recipient in a single transaction
 *
 * @param recipientAddress - Destination wallet address
 * @returns Transaction result with digest and transfer details
 * @throws Error if insufficient funds for any token or transaction fails
 */
export async function transferTokens(recipientAddress: string): Promise<TransferResult> {
  const keypair = getFaucetKeypair();
  const faucetAddress = keypair.toSuiAddress();
  const tokens = getTokensConfig();

  // Build single transaction for all token transfers
  const tx = new Transaction();
  const transfers: TokenTransfer[] = [];

  // Process each token configuration
  for (const tokenConfig of tokens) {
    const amount = BigInt(tokenConfig.amount);
    const isSuiCoin = tokenConfig.coinType === '0x2::sui::SUI';

    let splitCoin;

    if (isSuiCoin) {
      // For SUI token, use tx.gas to avoid gas payment issues
      [splitCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    } else {
      // For other tokens (USDC, WAL, etc.), get coin objects
      const coins = await getCoinsByType(faucetAddress, tokenConfig.coinType);

      if (coins.length === 0) {
        throw new Error(`Insufficient ${tokenConfig.coinType} in faucet wallet`);
      }

      // Find a coin with sufficient balance
      const suitableCoin = coins.find((coin) => coin.balance >= amount);

      if (!suitableCoin) {
        throw new Error(`Insufficient ${tokenConfig.coinType} in faucet wallet`);
      }

      // Split coin to get exact amount
      [splitCoin] = tx.splitCoins(tx.object(suitableCoin.objectId), [tx.pure.u64(amount)]);
    }

    // Transfer to recipient
    tx.transferObjects([splitCoin], tx.pure.address(recipientAddress));

    // Record transfer info
    transfers.push({
      coinType: tokenConfig.coinType,
      amount: tokenConfig.amount,
    });
  }

  // Sign and execute transaction (all transfers in one transaction)
  const result = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showObjectChanges: true,
      showEffects: true,
      showEvents: true,
    },
  });

  // Check transaction status
  if (result.effects?.status?.status !== 'success') {
    throw new Error('Transaction failed');
  }

  return {
    digest: result.digest,
    from: faucetAddress,
    to: recipientAddress,
    transfers,
  };
}

/**
 * Main faucet claim function
 * Validates address, checks for existing claims, transfers tokens, and records claim
 *
 * @param walletAddress - Sui wallet address requesting tokens
 * @returns Claim result with transaction details
 * @throws Error if validation fails, already claimed, or transfer fails
 */
export async function claimFaucet(walletAddress: string): Promise<ClaimResult> {
  // Validate wallet address format
  if (!isValidSuiAddress(walletAddress)) {
    throw new Error('Invalid wallet address format');
  }

  // Check if wallet has already claimed
  const alreadyClaimed = await hasAlreadyClaimed(walletAddress);
  if (alreadyClaimed) {
    throw new Error('Wallet has already claimed tokens');
  }

  // Transfer tokens first (before recording claim)
  // If transfer fails, claim won't be recorded
  const transferResult = await transferTokens(walletAddress);

  // Record claim in database only after successful transfer
  await recordClaim(walletAddress);

  return {
    success: true,
    digest: transferResult.digest,
    transfers: transferResult.transfers,
  };
}
