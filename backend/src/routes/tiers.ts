/**
 * Tiers API Routes
 *
 * Endpoints for querying subscription tiers.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { jsonResponse } from '../lib/json-serializer';

const router = Router();

/**
 * GET /api/tiers/:tierId
 *
 * Get tier by Sui object ID
 * Includes: creator info
 *
 * @param tierId - Tier's Sui object ID
 * @returns Tier object with creator or 404
 */
router.get('/:tierId', async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;

    const tier = await prisma.tier.findUnique({
      where: { tierId },
      include: {
        creator: true,
        _count: {
          select: {
            subscriptions: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!tier) {
      return res.status(404).json({
        error: 'Tier not found',
      });
    }

    res.json(jsonResponse(tier));
  } catch (error) {
    console.error('Error fetching tier:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
