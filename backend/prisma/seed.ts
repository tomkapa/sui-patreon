/**
 * Prisma Database Seed Script
 *
 * Seeds the database with test data for development and testing.
 * Run with: bunx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate a mock Sui address
 */
function generateSuiAddress(index: number): string {
  return `0x${index.toString().padStart(64, '0')}`;
}

/**
 * Generate a mock Sui object ID
 */
function generateObjectId(prefix: string, index: number): string {
  return `0x${prefix}${index.toString().padStart(60, '0')}`;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.contentTier.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.content.deleteMany();
  await prisma.tier.deleteMany();
  await prisma.creator.deleteMany();
  console.log('✅ Existing data cleared');

  // Create Creators
  console.log('👤 Creating creators...');
  const creator1 = await prisma.creator.create({
    data: {
      address: generateSuiAddress(1),
      profileId: generateObjectId('profile', 1),
      name: 'alice.sui',
      bio: 'Web3 educator and content creator. Building the future of decentralized social platforms.',
      avatarUrl: 'https://example.com/avatars/alice.jpg',
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      address: generateSuiAddress(2),
      profileId: generateObjectId('profile', 2),
      name: 'bob.sui',
      bio: 'Artist and NFT creator. Exploring the intersection of art and blockchain.',
      avatarUrl: 'https://example.com/avatars/bob.jpg',
    },
  });

  const creator3 = await prisma.creator.create({
    data: {
      address: generateSuiAddress(3),
      profileId: generateObjectId('profile', 3),
      name: 'charlie.sui',
      bio: 'Developer and blockchain enthusiast. Teaching Sui Move programming.',
      avatarUrl: null, // Test optional field
    },
  });

  console.log(`✅ Created ${3} creators`);

  // Create Tiers for each creator
  console.log('🎯 Creating subscription tiers...');

  // Alice's tiers
  const aliceBasic = await prisma.tier.create({
    data: {
      tierId: generateObjectId('tier', 1),
      creatorId: creator1.id,
      name: 'Basic',
      description: 'Access to all public content and monthly updates',
      price: BigInt(1_000_000_000), // 1 SUI
      isActive: true,
    },
  });

  const alicePremium = await prisma.tier.create({
    data: {
      tierId: generateObjectId('tier', 2),
      creatorId: creator1.id,
      name: 'Premium',
      description: 'All Basic benefits + exclusive tutorials and early access',
      price: BigInt(5_000_000_000), // 5 SUI
      isActive: true,
    },
  });

  // Bob's tiers
  const bobStandard = await prisma.tier.create({
    data: {
      tierId: generateObjectId('tier', 3),
      creatorId: creator2.id,
      name: 'Art Lover',
      description: 'Access to digital art collection and WIP previews',
      price: BigInt(3_000_000_000), // 3 SUI
      isActive: true,
    },
  });

  const bobCollector = await prisma.tier.create({
    data: {
      tierId: generateObjectId('tier', 4),
      creatorId: creator2.id,
      name: 'Collector',
      description: 'All Art Lover benefits + exclusive NFT drops',
      price: BigInt(10_000_000_000), // 10 SUI
      isActive: true,
    },
  });

  // Charlie's tier (inactive)
  const charlieArchived = await prisma.tier.create({
    data: {
      tierId: generateObjectId('tier', 5),
      creatorId: creator3.id,
      name: 'Developer',
      description: 'Archive - no longer available',
      price: BigInt(2_000_000_000), // 2 SUI
      isActive: false, // Test inactive tier
    },
  });

  console.log(`✅ Created ${5} tiers`);

  // Create Subscriptions
  console.log('📝 Creating subscriptions...');
  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const sub1 = await prisma.subscription.create({
    data: {
      subscriptionId: generateObjectId('sub', 1),
      subscriber: generateSuiAddress(100),
      tierId: aliceBasic.id,
      startsAt: now,
      expiresAt: oneMonthLater,
      isActive: true,
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      subscriptionId: generateObjectId('sub', 2),
      subscriber: generateSuiAddress(101),
      tierId: alicePremium.id,
      startsAt: now,
      expiresAt: threeMonthsLater,
      isActive: true,
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      subscriptionId: generateObjectId('sub', 3),
      subscriber: generateSuiAddress(102),
      tierId: bobStandard.id,
      startsAt: now,
      expiresAt: oneMonthLater,
      isActive: true,
    },
  });

  console.log(`✅ Created ${3} subscriptions`);

  // Create Content
  console.log('📄 Creating content...');

  // Alice's content
  const aliceContent1 = await prisma.content.create({
    data: {
      contentId: generateObjectId('content', 1),
      creatorId: creator1.id,
      title: 'Introduction to Sui Blockchain',
      description: 'Learn the basics of Sui blockchain and Move programming',
      contentType: 'video/mp4',
      sealedPatchId: 'blob_video_1',
      previewPatchId: 'blob_preview_1',
      isPublic: true, // Public content
    },
  });

  const aliceContent2 = await prisma.content.create({
    data: {
      contentId: generateObjectId('content', 2),
      creatorId: creator1.id,
      title: 'Advanced Move Patterns',
      description: 'Deep dive into advanced Move programming patterns',
      contentType: 'video/mp4',
      sealedPatchId: 'blob_video_2',
      previewPatchId: 'blob_preview_2',
      isPublic: false, // Premium content
    },
  });

  // Bob's content
  const bobContent1 = await prisma.content.create({
    data: {
      contentId: generateObjectId('content', 3),
      creatorId: creator2.id,
      title: 'Digital Art Collection 2024',
      description: 'My latest digital art pieces',
      contentType: 'image/png',
      sealedPatchId: 'blob_image_1',
      previewPatchId: null, // No preview
      isPublic: false,
    },
  });

  const bobContent2 = await prisma.content.create({
    data: {
      contentId: generateObjectId('content', 4),
      creatorId: creator2.id,
      title: 'NFT Creation Process',
      description: 'Behind the scenes of creating NFTs',
      contentType: 'video/mp4',
      sealedPatchId: 'blob_video_3',
      previewPatchId: 'blob_preview_3',
      isPublic: true,
    },
  });

  console.log(`✅ Created ${4} content pieces`);

  // Create Content-Tier relationships (many-to-many)
  console.log('🔗 Creating content-tier relationships...');

  // Alice's premium content requires Premium tier
  await prisma.contentTier.create({
    data: {
      contentId: aliceContent2.id,
      tierId: alicePremium.id,
    },
  });

  // Bob's art collection requires Standard tier
  await prisma.contentTier.create({
    data: {
      contentId: bobContent1.id,
      tierId: bobStandard.id,
    },
  });

  // Bob's art collection ALSO available to Collector tier (many-to-many test)
  await prisma.contentTier.create({
    data: {
      contentId: bobContent1.id,
      tierId: bobCollector.id,
    },
  });

  console.log(`✅ Created ${3} content-tier relationships`);

  // Display summary
  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log(`Creators: ${await prisma.creator.count()}`);
  console.log(`Tiers: ${await prisma.tier.count()}`);
  console.log(`Subscriptions: ${await prisma.subscription.count()}`);
  console.log(`Content: ${await prisma.content.count()}`);
  console.log(`Content-Tier Links: ${await prisma.contentTier.count()}`);

  console.log('\n✅ Database seeding completed successfully!');
}

// Execute seed
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
