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
 * GET /api/tiers/creator/:walletAddress
 *
 * Get all tiers for a specific creator by wallet address
 * Includes: subscriber counts for each tier
 *
 * Query params:
 * - includeInactive (boolean): Include deactivated tiers (default: false)
 *
 * @param walletAddress - Creator's Sui wallet address
 * @returns Array of tier objects with subscriber counts or 404
 */
router.get('/creator/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    // First verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { address: walletAddress },
    });

    if (!creator) {
      return res.status(404).json({
        error: 'Creator not found',
      });
    }

    // Build where clause for tiers
    const whereClause: any = { creatorId: creator.id };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Fetch tiers for this creator
    const tiers = await prisma.tier.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Add subscriber counts for each tier
    const tiersWithCounts = await Promise.all(
      tiers.map(async (tier) => {
        const subscriberCount = await prisma.subscription.count({
          where: {
            tierId: tier.id,
            isActive: true,
            expiresAt: { gte: new Date() },
          },
        });

        return {
          ...tier,
          subscriberCount,
        };
      })
    );

    res.json(jsonResponse({
      creator: {
        id: creator.id,
        address: creator.address,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
      },
      tiers: tiersWithCounts,
    }));
  } catch (error) {
    console.error('Error fetching creator tiers:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/tiers/:tierId
 *
 * Get tier by Sui object ID
 * Includes: creator info and subscriber count
 *
 * @param tierId - Tier's Sui object ID
 * @returns Tier object with creator or 404
 */
router.get('/:tierId', async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;

    const tier = await prisma.tier.findUnique({
      where: { tierId },
    });

    if (!tier) {
      return res.status(404).json({
        error: 'Tier not found',
      });
    }

    // Manually fetch creator (no Prisma relations)
    const creator = await prisma.creator.findUnique({
      where: { id: tier.creatorId },
    });

    // Count active subscriptions
    const subscriberCount = await prisma.subscription.count({
      where: {
        tierId: tier.id,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
    });

    res.json(jsonResponse({
      ...tier,
      creator,
      subscriberCount,
    }));
  } catch (error) {
    console.error('Error fetching tier:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
