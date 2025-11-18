/**
 * Subscriptions API Routes
 *
 * Endpoints for querying user subscriptions.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { jsonResponse } from '../lib/json-serializer';

const router = Router();

/**
 * GET /api/subscriptions/:address
 *
 * Get user's active subscriptions
 * Includes: tier and creator info
 *
 * @param address - Subscriber's Sui wallet address
 * @returns Array of active subscriptions
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriber: address,
        isActive: true,
        expiresAt: {
          gte: new Date(), // Only include non-expired subscriptions
        },
      },
      include: {
        tier: {
          include: {
            creator: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jsonResponse(subscriptions));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
