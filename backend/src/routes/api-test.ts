/**
 * Manual API Testing Script
 *
 * Run this to manually test the API endpoints
 * Usage: bun src/routes/api-test.ts
 */

import { prisma } from '../lib/prisma';

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test 1: Search creators
    console.log('1. Testing GET /api/creators (search)');
    const creators = await prisma.creator.findMany({
      where: {
        name: {
          contains: 'alice',
          mode: 'insensitive',
        },
      },
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Found ${creators.length} creators`);
    if (creators.length > 0) {
      console.log(`   Example: ${creators[0].name} with ${creators[0].tiers.length} tiers`);
    }

    // Test 2: Get creator by address
    console.log('\n2. Testing GET /api/creators/:address');
    const testAddress = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const creator = await prisma.creator.findUnique({
      where: { address: testAddress },
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

    if (creator) {
      console.log(`   Found: ${creator.name}`);
      console.log(`   Tiers: ${creator.tiers.length}`);
      console.log(`   Content: ${creator.contents.length}`);
    } else {
      console.log(`   Creator not found (this is OK if no test data)`);
    }

    // Test 3: Get tier by ID
    console.log('\n3. Testing GET /api/tiers/:tierId');
    const firstTier = await prisma.tier.findFirst({
      include: {
        creator: true,
      },
    });

    if (firstTier) {
      console.log(`   Found tier: ${firstTier.name}`);
      console.log(`   Price: ${firstTier.price.toString()} MIST`);
      console.log(`   Creator: ${firstTier.creator.name}`);
    } else {
      console.log(`   No tiers found (this is OK if no test data)`);
    }

    // Test 4: Get subscriptions
    console.log('\n4. Testing GET /api/subscriptions/:address');
    const subscriber = '0x9999999999999999999999999999999999999999999999999999999999999999';
    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriber,
        isActive: true,
        expiresAt: {
          gte: new Date(),
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

    console.log(`   Found ${subscriptions.length} active subscriptions`);
    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      console.log(`   Example: ${sub.tier.creator.name} - ${sub.tier.name}`);
    }

    // Test 5: Get content by ID
    console.log('\n5. Testing GET /api/content/:contentId');
    const firstContent = await prisma.content.findFirst({
      include: {
        creator: true,
        contentTiers: {
          include: {
            tier: true,
          },
        },
      },
    });

    if (firstContent) {
      console.log(`   Found content: ${firstContent.title}`);
      console.log(`   Creator: ${firstContent.creator.name}`);
      console.log(`   Public: ${firstContent.isPublic}`);
      console.log(`   Required tiers: ${firstContent.contentTiers.length}`);
    } else {
      console.log(`   No content found (this is OK if no test data)`);
    }

    // Test 6: Check content access
    console.log('\n6. Testing GET /api/content/:contentId/access');
    if (firstContent) {
      const requiredTierIds = firstContent.contentTiers.map(ct => ct.tierId);

      if (firstContent.isPublic) {
        console.log(`   Content is public - accessible to all`);
      } else if (requiredTierIds.length === 0) {
        console.log(`   No tier requirements - accessible to all`);
      } else {
        const hasAccess = await prisma.subscription.findFirst({
          where: {
            subscriber,
            tierId: { in: requiredTierIds },
            isActive: true,
            startsAt: { lte: new Date() },
            expiresAt: { gte: new Date() },
          },
        });

        console.log(`   User has access: ${hasAccess ? 'YES' : 'NO'}`);
      }
    }

    console.log('\n✅ API endpoint tests completed successfully');
  } catch (error) {
    console.error('❌ Error during API tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testAPI();
