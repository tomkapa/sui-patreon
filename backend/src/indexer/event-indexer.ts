// Core event indexer logic with polling-based event processing
import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { SuiEvent, EventId, SuiEventFilter } from '@mysten/sui/client';
import { getCheckpoint, updateCheckpoint, type EventType, prisma } from './checkpoint';
import { handleProfileCreated, handleProfileUpdated } from '../handlers/profile';
import {
  handleTierCreated,
  handleTierPriceUpdated,
  handleTierDeactivated,
  handleSubscriptionPurchased,
} from '../handlers/subscription';
import { handleContentCreated } from '../handlers/content';

// Configuration from environment
const PACKAGE_ID = process.env.PACKAGE_ID;
const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL) || 5000;
const QUERY_LIMIT = Number(process.env.QUERY_LIMIT) || 50;

if (!PACKAGE_ID) {
  throw new Error('PACKAGE_ID environment variable is required');
}

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'),
});

// Type definitions
type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
  cursor: SuiEventsCursor;
  hasNextPage: boolean;
};

type EventTracker = {
  type: EventType;
  filter: SuiEventFilter;
  callback: (event: SuiEvent, txDigest: string, eventSeq: string) => Promise<void>;
};

// Event trackers configuration
const EVENTS_TO_TRACK: EventTracker[] = [
  {
    type: 'ProfileCreated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::profile::ProfileCreated`,
    },
    callback: handleProfileCreated,
  },
  {
    type: 'ProfileUpdated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::profile::ProfileUpdated`,
    },
    callback: handleProfileUpdated,
  },
  {
    type: 'TierCreated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::subscription::TierCreated`,
    },
    callback: handleTierCreated,
  },
  {
    type: 'TierPriceUpdated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::subscription::TierPriceUpdated`,
    },
    callback: handleTierPriceUpdated,
  },
  {
    type: 'TierDeactivated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::subscription::TierDeactivated`,
    },
    callback: handleTierDeactivated,
  },
  {
    type: 'SubscriptionPurchased',
    filter: {
      MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionPurchased`,
    },
    callback: handleSubscriptionPurchased,
  },
  {
    type: 'ContentCreated',
    filter: {
      MoveEventType: `${PACKAGE_ID}::content::ContentCreated`,
    },
    callback: handleContentCreated,
  },
];

/**
 * Execute a single event query and process results (matches example pattern)
 */
const executeEventJob = async (
  tracker: EventTracker,
  cursor: SuiEventsCursor
): Promise<EventExecutionResult> => {
  try {
    const { data, hasNextPage, nextCursor } = await suiClient.queryEvents({
      query: tracker.filter,
      cursor,
      limit: QUERY_LIMIT,
      order: 'ascending',
    });

    // Process each event
    for (const event of data) {
      const eventSeq = event.id.eventSeq;
      const txDigest = event.id.txDigest;

      console.log(`[${tracker.type}] Processing event seq ${eventSeq}, tx ${txDigest}`);

      try {
        await tracker.callback(event, txDigest, eventSeq);
      } catch (error) {
        console.error(`[${tracker.type}] Error processing event ${eventSeq}:`, error);
        // Continue processing other events despite errors
      }
    }

    // Save cursor after processing all events in batch (matches example's saveLatestCursor)
    if (nextCursor && data.length > 0) {
      await updateCheckpoint(tracker.type, nextCursor);

      return {
        cursor: nextCursor,
        hasNextPage,
      };
    }
  } catch (error) {
    console.error(`[${tracker.type}] Error querying events:`, error);

    // If error is "Invalid params", likely due to invalid cursor - reset and start from beginning
    if (error instanceof Error && error.message.includes('Invalid params')) {
      console.warn(
        `[${tracker.type}] Invalid cursor detected, resetting to start from beginning`
      );
      return {
        cursor: undefined,
        hasNextPage: false,
      };
    }
  }

  return {
    cursor,
    hasNextPage: false,
  };
};

/**
 * Run polling job for a specific event type (matches example pattern)
 */
const runEventJob = async (
  tracker: EventTracker,
  cursor: SuiEventsCursor
): Promise<void> => {
  const result = await executeEventJob(tracker, cursor);

  // Schedule next iteration
  setTimeout(
    () => {
      runEventJob(tracker, result.cursor);
    },
    result.hasNextPage ? 0 : POLL_INTERVAL
  );
};

/**
 * Setup event listeners for all tracked events
 * This is the main entry point called from the indexer
 */
export const setupListeners = async (): Promise<void> => {
  console.log('='.repeat(60));
  console.log('[Indexer] Sui Patreon Event Indexer Starting...');
  console.log('[Indexer] Using polling-based queryEvents API');
  console.log('='.repeat(60));
  console.log(`[Indexer] Package ID: ${PACKAGE_ID}`);
  console.log(`[Indexer] Network: ${SUI_NETWORK}`);
  console.log(`[Indexer] Poll Interval: ${POLL_INTERVAL}ms`);
  console.log(`[Indexer] Query Limit: ${QUERY_LIMIT} events per query`);
  console.log('='.repeat(60));

  try {
    // Test database connection
    await prisma.$connect();
    console.log(`[Indexer] Database connection established`);

    console.log(`[Indexer] Indexer is running. Press Ctrl+C to stop.`);
    console.log('='.repeat(60));

    // Start polling for each event type (matches example pattern)
    for (const tracker of EVENTS_TO_TRACK) {
      const cursor = await getCheckpoint(tracker.type); // Returns EventId | undefined

      console.log(`[${tracker.type}] Starting event polling...`);
      runEventJob(tracker, cursor);
    }
  } catch (error) {
    console.error(`[Indexer] Failed to start indexer:`, error);
    await prisma.$disconnect();
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
export async function shutdown(): Promise<void> {
  console.log(`[Indexer] Shutting down gracefully...`);
  await prisma.$disconnect();
  console.log(`[Indexer] Cleanup complete`);
  process.exit(0);
}
