// Checkpoint management utilities for resumable event indexing (matches example pattern)
import { PrismaClient } from '@prisma/client';
import type { EventId } from '@mysten/sui/client';

const prisma = new PrismaClient();

export type EventType =
  | 'ProfileCreated'
  | 'ProfileUpdated'
  | 'TierCreated'
  | 'TierPriceUpdated'
  | 'TierDeactivated'
  | 'SubscriptionPurchased'
  | 'ContentCreated';

/**
 * Retrieve the last cursor for a given event type (matches example's getLatestCursor)
 */
export async function getCheckpoint(eventType: EventType): Promise<EventId | undefined> {
  const cursor = await prisma.cursor.findUnique({
    where: { id: eventType },
  });

  if (cursor) {
    console.log(
      `[Checkpoint] Resuming ${eventType} from sequence ${cursor.eventSeq}, tx ${cursor.txDigest}`
    );
    return {
      eventSeq: cursor.eventSeq,
      txDigest: cursor.txDigest,
    };
  }

  return undefined;
}

/**
 * Save cursor after successfully processing events (matches example's saveLatestCursor)
 */
export async function updateCheckpoint(
  eventType: EventType,
  cursor: EventId
): Promise<void> {
  await prisma.cursor.upsert({
    where: { id: eventType },
    update: {
      eventSeq: cursor.eventSeq,
      txDigest: cursor.txDigest,
    },
    create: {
      id: eventType,
      eventSeq: cursor.eventSeq,
      txDigest: cursor.txDigest,
    },
  });
}

export { prisma };
