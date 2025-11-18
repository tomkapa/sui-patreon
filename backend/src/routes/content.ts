/**
 * Content API Routes
 *
 * Endpoints for querying content and checking access permissions.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { jsonResponse } from '../lib/json-serializer';

const router = Router();

/**
 * GET /api/content/:contentId
 *
 * Get content by Sui object ID
 * Includes: tiers and creator info
 *
 * @param contentId - Content's Sui object ID
 * @returns Content object with relations or 404
 */
router.get('/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const content = await prisma.content.findUnique({
      where: { contentId },
      include: {
        creator: true,
        contentTiers: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found',
      });
    }

    res.json(jsonResponse(content));
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/content/:contentId/access
 *
 * Check if user has access to content
 * Verifies active subscription to required tier
 *
 * Query params:
 * - address (required): User's Sui wallet address
 *
 * @param contentId - Content's Sui object ID
 * @returns { hasAccess: boolean, reason?: string }
 */
router.get('/:contentId/access', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { address } = req.query;

    // Validate address parameter
    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        error: 'Invalid parameters: address query parameter required',
      });
    }

    // Fetch content with tier requirements
    const content = await prisma.content.findUnique({
      where: { contentId },
      include: {
        contentTiers: {
          select: {
            tierId: true,
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        error: 'Content not found',
      });
    }

    // Public content is accessible to everyone
    if (content.isPublic) {
      return res.json({
        hasAccess: true,
        reason: 'Content is public',
      });
    }

    // Check if content requires specific tiers
    if (content.contentTiers.length === 0) {
      // No tier requirements - accessible to all
      return res.json({
        hasAccess: true,
        reason: 'No tier requirements',
      });
    }

    // Get required tier IDs
    const requiredTierIds = content.contentTiers.map(ct => ct.tierId);

    // Check for active subscription to any required tier
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        subscriber: address,
        tierId: {
          in: requiredTierIds,
        },
        isActive: true,
        startsAt: {
          lte: new Date(),
        },
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        tier: {
          select: {
            name: true,
          },
        },
      },
    });

    if (activeSubscription) {
      return res.json({
        hasAccess: true,
        reason: `Active subscription to ${activeSubscription.tier.name}`,
      });
    }

    // No active subscription found
    res.json({
      hasAccess: false,
      reason: 'No active subscription to required tier',
    });
  } catch (error) {
    console.error('Error checking content access:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
