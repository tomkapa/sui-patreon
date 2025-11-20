/**
 * Faucet API Routes
 *
 * Endpoint for claiming tokens from the faucet.
 */

import { Router, Request, Response } from 'express';
import { claimFaucet } from '../services/faucet.service';
import { isValidSuiAddress } from '../lib/validation';

const router = Router();

/**
 * POST /api/faucet
 *
 * Claim tokens from the faucet for a wallet address
 *
 * Request body:
 * - walletAddress (string): Sui wallet address to receive tokens
 *
 * Response:
 * - 200: { success: true, digest: string, transfers: [{ coinType, amount }] }
 * - 400: { success: false, error: string } - Invalid address or already claimed
 * - 500: { success: false, error: string } - Insufficient funds or transaction failed
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    // Validate request body
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
      });
    }

    if (typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address must be a string',
      });
    }

    // Validate wallet address format
    if (!isValidSuiAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    // Claim tokens
    const result = await claimFaucet(walletAddress);

    res.json({
      success: true,
      digest: result.digest,
      transfers: result.transfers,
    });
  } catch (error) {
    console.error('Faucet claim error:', error);

    // Determine error type and status code
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Client errors (400)
    if (
      errorMessage.includes('already claimed') ||
      errorMessage.includes('Invalid wallet address')
    ) {
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    // Server errors (500)
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
