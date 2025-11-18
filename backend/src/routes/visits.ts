/**
 * Visits API Routes
 *
 * Endpoints for tracking user visits to creator profiles.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { jsonResponse } from '../lib/json-serializer';
import { validateLimit } from '../lib/validation';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * POST /api/visits
 *
 * Track a visit to a creator profile
 *
 * Body:
 * - creatorAddress: string (required) - Creator's Sui wallet address
 * - userAddress: string (optional) - Visitor's wallet address (generates session ID if not provided)
 *
 * Returns:
 * - success: boolean
 * - visitId: string - UUID of the visit record
 *
 * Notes:
 * - Implements upsert pattern: if user visited same creator in last 24h, updates timestamp
 * - If no userAddress provided, generates a session ID (UUID)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { creatorAddress, userAddress } = req.body;

    // Validate required parameters
    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: creatorAddress',
      });
    }

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { address: creatorAddress },
      select: { id: true },
    });

    if (!creator) {
      return res.status(404).json({
        error: 'Creator not found',
      });
    }

    // Use provided userAddress or generate session ID
    const visitorAddress = userAddress || `session_${randomUUID()}`;

    // Check if user visited this creator in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingVisit = await prisma.visit.findFirst({
      where: {
        userAddress: visitorAddress,
        creatorId: creator.id,
        visitedAt: { gte: oneDayAgo },
      },
      orderBy: { visitedAt: 'desc' },
    });

    let visit;

    if (existingVisit) {
      // Update existing visit timestamp
      visit = await prisma.visit.update({
        where: { id: existingVisit.id },
        data: { visitedAt: new Date() },
      });
    } else {
      // Create new visit
      visit = await prisma.visit.create({
        data: {
          userAddress: visitorAddress,
          creatorId: creator.id,
        },
      });
    }

    res.json(
      jsonResponse({
        success: true,
        visitId: visit.id,
      })
    );
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/visits/recent/:userAddress
 *
 * Get recently visited creators for a user
 *
 * Path params:
 * - userAddress: string - Visitor's wallet address or session ID
 *
 * Query params:
 * - limit: number (default: 10, max: 50) - Number of visits to return
 *
 * Returns:
 * - visits: Array of visit records with creator details, sorted by most recent first
 *
 * Each visit contains:
 * - visitId: string
 * - visitedAt: Date
 * - creator: object with id, address, name, bio, avatarUrl, followerCount, contentCount
 */
router.get('/recent/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;

    // Validate limit (default: 10, max: 50)
    const limit = validateLimit(req.query.limit as string, 10, 50);

    // Fetch recent visits for user, sorted by most recent first
    // Fetch more than limit to account for duplicates
    const visits = await prisma.visit.findMany({
      where: { userAddress },
      orderBy: { visitedAt: 'desc' },
      take: limit * 3, // Fetch 3x limit to ensure we have enough after deduplication
    });

    // If no visits, return empty array
    if (visits.length === 0) {
      return res.json(jsonResponse({ visits: [] }));
    }

    // Deduplicate visits by creatorId - keep only most recent visit per creator
    const seenCreatorIds = new Set<string>();
    const uniqueVisits = visits.filter((visit) => {
      if (seenCreatorIds.has(visit.creatorId)) {
        return false; // Skip duplicate
      }
      seenCreatorIds.add(visit.creatorId);
      return true;
    });

    // Take only the requested limit after deduplication
    const limitedVisits = uniqueVisits.slice(0, limit);

    // Fetch creator details for each visit
    const visitsWithCreators = await Promise.all(
      limitedVisits.map(async (visit) => {
        const creator = await prisma.creator.findUnique({
          where: { id: visit.creatorId },
        });

        if (!creator) {
          // Skip if creator was deleted
          return null;
        }

        // Get follower count (active subscriptions across all creator's tiers)
        const followerCount = await getFollowerCount(creator.id);

        // Get content count (published content only)
        const contentCount = await getContentCount(creator.id);

        return {
          visitId: visit.id,
          visitedAt: visit.visitedAt,
          creator: {
            id: creator.id,
            address: creator.address,
            name: creator.name,
            bio: creator.bio,
            avatarUrl: creator.avatarUrl,
            followerCount,
            contentCount,
          },
        };
      })
    );

    // Filter out null entries (deleted creators)
    const validVisits = visitsWithCreators.filter((v) => v !== null);

    res.json(jsonResponse({ visits: validVisits }));
  } catch (error) {
    console.error('Error fetching recent visits:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * Get follower count for a creator
 * Counts active, non-expired subscriptions across all their tiers
 */
async function getFollowerCount(creatorId: string): Promise<number> {
  // Get all tiers for this creator
  const tiers = await prisma.tier.findMany({
    where: { creatorId },
    select: { id: true },
  });

  const tierIds = tiers.map((tier) => tier.id);

  if (tierIds.length === 0) {
    return 0;
  }

  // Count active, non-expired subscriptions
  const count = await prisma.subscription.count({
    where: {
      tierId: { in: tierIds },
      isActive: true,
      expiresAt: { gte: new Date() },
    },
  });

  return count;
}

/**
 * Get content count for a creator
 * Counts published (non-draft) content
 */
async function getContentCount(creatorId: string): Promise<number> {
  const count = await prisma.content.count({
    where: {
      creatorId,
      isDraft: false,
    },
  });

  return count;
}

export default router;
