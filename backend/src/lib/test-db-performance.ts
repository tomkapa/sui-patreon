/**
 * Database Performance Test Script
 *
 * Tests query performance on indexed fields
 * Run with: bun src/lib/test-db-performance.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Measure query execution time
 */
async function measureQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await query();
  const end = performance.now();
  const durationMs = end - start;

  console.log(`${name}: ${durationMs.toFixed(2)}ms`);

  return { result, durationMs };
}

/**
 * Main test function
 */
async function main() {
  console.log('🔍 Testing Database Performance...\n');

  // Test 1: Query creator by address (indexed)
  console.log('Test 1: Find creator by address (indexed)');
  const { durationMs: addressQueryTime } = await measureQuery(
    'Creator.findUnique({ where: { address } })',
    async () => {
      return await prisma.creator.findUnique({
        where: { address: '0x0000000000000000000000000000000000000000000000000000000000000001' },
      });
    }
  );

  // Test 2: Query creator by name (indexed)
  console.log('\nTest 2: Find creator by name (indexed)');
  const { durationMs: nameQueryTime } = await measureQuery(
    'Creator.findUnique({ where: { name } })',
    async () => {
      return await prisma.creator.findUnique({
        where: { name: 'alice.sui' },
      });
    }
  );

  // Test 3: Query subscriptions by subscriber (indexed)
  console.log('\nTest 3: Find subscriptions by subscriber (indexed)');
  const { durationMs: subQueryTime } = await measureQuery(
    'Subscription.findMany({ where: { subscriber } })',
    async () => {
      return await prisma.subscription.findMany({
        where: { subscriber: '0x0000000000000000000000000000000000000000000000000000000000000100' },
      });
    }
  );

  // Test 4: Query content with creator relationship
  console.log('\nTest 4: Find content with creator (join)');
  const { durationMs: joinQueryTime } = await measureQuery(
    'Content.findMany({ include: { creator } })',
    async () => {
      return await prisma.content.findMany({
        include: { creator: true },
      });
    }
  );

  // Test 5: Complex query with multiple joins
  console.log('\nTest 5: Find tiers with creator, subscriptions, and content');
  const { durationMs: complexQueryTime } = await measureQuery(
    'Tier.findMany({ include: { creator, subscriptions, contentTiers } })',
    async () => {
      return await prisma.tier.findMany({
        include: {
          creator: true,
          subscriptions: true,
          contentTiers: {
            include: {
              content: true,
            },
          },
        },
      });
    }
  );

  // Test 6: Many-to-many query
  console.log('\nTest 6: Find content with accessible tiers');
  const { durationMs: manyToManyTime } = await measureQuery(
    'Content.findFirst({ include: { contentTiers: { include: { tier } } } })',
    async () => {
      return await prisma.content.findFirst({
        where: {
          isPublic: false,
        },
        include: {
          contentTiers: {
            include: {
              tier: true,
            },
          },
        },
      });
    }
  );

  // Test 7: Aggregation query
  console.log('\nTest 7: Count subscriptions per tier');
  const { durationMs: aggregateTime } = await measureQuery(
    'Subscription.groupBy({ by: ["tierId"], _count: true })',
    async () => {
      return await prisma.subscription.groupBy({
        by: ['tierId'],
        _count: {
          _all: true,
        },
      });
    }
  );

  // Performance summary
  console.log('\n📊 Performance Summary');
  console.log('======================');
  console.log(`Indexed address query: ${addressQueryTime.toFixed(2)}ms`);
  console.log(`Indexed name query: ${nameQueryTime.toFixed(2)}ms`);
  console.log(`Indexed subscriber query: ${subQueryTime.toFixed(2)}ms`);
  console.log(`Join query (1 relation): ${joinQueryTime.toFixed(2)}ms`);
  console.log(`Complex join (3 relations): ${complexQueryTime.toFixed(2)}ms`);
  console.log(`Many-to-many query: ${manyToManyTime.toFixed(2)}ms`);
  console.log(`Aggregation query: ${aggregateTime.toFixed(2)}ms`);

  // Performance assertions (targets < 10ms for indexed queries)
  const indexedQueries = [addressQueryTime, nameQueryTime, subQueryTime];
  const avgIndexedTime = indexedQueries.reduce((a, b) => a + b, 0) / indexedQueries.length;

  console.log(`\nAverage indexed query time: ${avgIndexedTime.toFixed(2)}ms`);

  if (avgIndexedTime < 10) {
    console.log('✅ Performance target met: Indexed queries < 10ms');
  } else {
    console.log('⚠️ Performance warning: Indexed queries > 10ms');
  }

  console.log('\n✅ Performance tests completed!');
}

// Execute tests
main()
  .catch((error) => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
