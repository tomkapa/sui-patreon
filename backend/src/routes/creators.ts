/**
 * Creators API Routes
 *
 * Endpoints for querying creators and their content.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { jsonResponse } from '../lib/json-serializer';
import { validateLimit, sanitizeSearchQuery } from '../lib/validation';

const router = Router();

/**
 * GET /api/creators/:address
 *
 * Get creator by Sui address
 * Includes: tiers, content (with tiers)
 *
 * @param address - Creator's Sui wallet address
 * @returns Creator object with relations or 404
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { address },
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        contents: {
          orderBy: { createdAt: 'desc' },
          include: {
            contentTiers: {
              include: {
                tier: true,
              },
            },
          },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({
        error: 'Creator not found',
      });
    }

    res.json(jsonResponse(creator));
  } catch (error) {
    console.error('Error fetching creator:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/creators
 *
 * Search creators by name
 *
 * Query params:
 * - query (string): Search term for creator name (case-insensitive)
 * - limit (number): Max results (default: 20, max: 100)
 *
 * @returns Array of creators with tiers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const limit = validateLimit(req.query.limit as string);

    // Build where clause
    const where = query
      ? {
          name: {
            contains: sanitizeSearchQuery(query as string),
            mode: 'insensitive' as const,
          },
        }
      : {};

    const creators = await prisma.creator.findMany({
      where,
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.json(jsonResponse(creators));
  } catch (error) {
    console.error('Error searching creators:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/creators/:address/content
 *
 * Get all content for a creator
 *
 * @param address - Creator's Sui wallet address
 * @returns Array of content with tiers
 */
router.get('/:address/content', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // First verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { address },
      select: { id: true },
    });

    if (!creator) {
      return res.status(404).json({
        error: 'Creator not found',
      });
    }

    // Fetch content
    const content = await prisma.content.findMany({
      where: { creatorId: creator.id },
      include: {
        contentTiers: {
          include: {
            tier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jsonResponse(content));
  } catch (error) {
    console.error('Error fetching creator content:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
