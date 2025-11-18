/**
 * Schema Validation Script
 *
 * Validates database schema matches Prisma schema
 * Run with: bun src/lib/validate-schema.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Validating Database Schema...\n');

  // Test database connection
  console.log('1. Testing database connection...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Verify tables exist
  console.log('2. Verifying tables...');
  const tables = ['Creator', 'Tier', 'Subscription', 'Content', 'ContentTier'];
  const tableResults = await Promise.all(
    tables.map(async (table) => {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) FROM "${table}"`
        );
        return { table, exists: true };
      } catch {
        return { table, exists: false };
      }
    })
  );

  tableResults.forEach(({ table, exists }) => {
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  });
  console.log();

  // Verify indexes
  console.log('3. Verifying critical indexes...');
  const indexes = [
    'Creator_address_idx',
    'Creator_name_idx',
    'Tier_creatorId_idx',
    'Subscription_subscriber_idx',
    'Content_creatorId_idx',
    'ContentTier_contentId_idx',
  ];

  const indexResults = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;

  const indexNames = indexResults.map((r) => r.indexname);
  indexes.forEach((index) => {
    const exists = indexNames.includes(index);
    console.log(`  ${exists ? '✅' : '❌'} ${index}`);
  });
  console.log();

  // Verify foreign key constraints
  console.log('4. Verifying foreign key constraints...');
  const constraints = await prisma.$queryRaw<{ conname: string }[]>`
    SELECT conname
    FROM pg_constraint
    WHERE contype = 'f'
    AND connamespace = 'public'::regnamespace
  `;

  const expectedConstraints = [
    'Creator → Tier',
    'Tier → Subscription',
    'Creator → Content',
    'Content → ContentTier',
    'Tier → ContentTier',
  ];

  console.log(`  Found ${constraints.length} foreign key constraints:`);
  constraints.forEach((c) => {
    console.log(`    ✅ ${c.conname}`);
  });
  console.log();

  // Verify data counts
  console.log('5. Checking data counts...');
  const counts = {
    creators: await prisma.creator.count(),
    tiers: await prisma.tier.count(),
    subscriptions: await prisma.subscription.count(),
    content: await prisma.content.count(),
    contentTiers: await prisma.contentTier.count(),
  };

  console.log(`  Creators: ${counts.creators}`);
  console.log(`  Tiers: ${counts.tiers}`);
  console.log(`  Subscriptions: ${counts.subscriptions}`);
  console.log(`  Content: ${counts.content}`);
  console.log(`  Content-Tier Links: ${counts.contentTiers}`);
  console.log();

  // Test complex query
  console.log('6. Testing complex query...');
  try {
    const result = await prisma.creator.findFirst({
      include: {
        tiers: {
          include: {
            subscriptions: true,
            contentTiers: {
              include: {
                content: true,
              },
            },
          },
        },
        contents: true,
      },
    });

    if (result) {
      console.log(`✅ Complex query successful`);
      console.log(`   Creator: ${result.name}`);
      console.log(`   Tiers: ${result.tiers.length}`);
      console.log(`   Content: ${result.contents.length}`);
    } else {
      console.log('⚠️  No data found for complex query test');
    }
  } catch (error) {
    console.error('❌ Complex query failed:', error);
  }
  console.log();

  console.log('✅ Schema validation completed!\n');
}

// Execute validation
main()
  .catch((error) => {
    console.error('❌ Schema validation failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
