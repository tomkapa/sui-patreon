# Database Schema Documentation

## Overview

This directory contains the Prisma schema and migrations for the Sui Patreon platform backend.

**Database:** PostgreSQL 15+
**ORM:** Prisma 6.19.0
**Connection:** `postgresql://admin:password@localhost:5432/sui_patreon?schema=public`

## Schema Models

### Creator
Represents content creators on the platform.

**Fields:**
- `id` (UUID, PK): Internal unique identifier
- `address` (String, Unique): Sui wallet address
- `profileId` (String, Unique): Sui object ID for on-chain profile
- `name` (String, Unique): Unique creator name (e.g., SuiNS name)
- `bio` (String): Creator biography
- `avatarUrl` (String?): Optional avatar image URL
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relationships:**
- Has many `Tier` (one-to-many)
- Has many `Content` (one-to-many)

**Indexes:**
- `address` (for wallet lookups)
- `name` (for name-based searches)

---

### Tier
Subscription tiers offered by creators.

**Fields:**
- `id` (UUID, PK): Internal unique identifier
- `tierId` (String, Unique): Sui object ID for on-chain tier
- `creatorId` (UUID, FK): Reference to Creator
- `name` (String): Tier name (e.g., "Basic", "Premium")
- `description` (String): Tier description
- `price` (BigInt): Price in MIST (1 SUI = 1,000,000,000 MIST)
- `isActive` (Boolean): Whether tier is currently active
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- Belongs to `Creator` (many-to-one)
- Has many `Subscription` (one-to-many)
- Has many `Content` through `ContentTier` (many-to-many)

**Indexes:**
- `creatorId` (for creator-based queries)
- `tierId` (for blockchain object lookups)

---

### Subscription
Active subscriptions from subscribers to tiers.

**Fields:**
- `id` (UUID, PK): Internal unique identifier
- `subscriptionId` (String, Unique): Sui object ID for on-chain subscription
- `subscriber` (String): Sui wallet address of subscriber
- `tierId` (UUID, FK): Reference to Tier
- `startsAt` (DateTime): Subscription start timestamp
- `expiresAt` (DateTime): Subscription expiration timestamp
- `isActive` (Boolean): Whether subscription is currently active
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- Belongs to `Tier` (many-to-one)

**Indexes:**
- `subscriber` (for subscriber-based queries)
- `subscriptionId` (for blockchain object lookups)
- `tierId` (for tier-based queries)

---

### Content
Content pieces created by creators.

**Fields:**
- `id` (UUID, PK): Internal unique identifier
- `contentId` (String, Unique): Sui object ID for on-chain content
- `creatorId` (UUID, FK): Reference to Creator
- `title` (String): Content title
- `description` (String): Content description
- `contentType` (String): MIME type (e.g., "video/mp4", "image/png")
- `walrusBlobId` (String): Walrus blob ID for encrypted content
- `previewBlobId` (String?): Optional Walrus blob ID for public preview
- `isPublic` (Boolean): If true, accessible without subscription
- `createdAt` (DateTime): Creation timestamp

**Relationships:**
- Belongs to `Creator` (many-to-one)
- Has many `Tier` through `ContentTier` (many-to-many)

**Indexes:**
- `creatorId` (for creator-based queries)
- `contentId` (for blockchain object lookups)

---

### ContentTier
Junction table for many-to-many relationship between Content and Tier.

**Fields:**
- `contentId` (UUID, FK, Composite PK): Reference to Content
- `tierId` (UUID, FK, Composite PK): Reference to Tier

**Relationships:**
- Belongs to `Content` (many-to-one)
- Belongs to `Tier` (many-to-one)

**Indexes:**
- `contentId` (for content-based queries)
- `tierId` (for tier-based queries)

---

## Cascade Deletes

All foreign key relationships use `ON DELETE CASCADE`:

- Deleting a `Creator` cascades to:
  - All associated `Tier` records
  - All associated `Content` records

- Deleting a `Tier` cascades to:
  - All associated `Subscription` records
  - All associated `ContentTier` junction records

- Deleting `Content` cascades to:
  - All associated `ContentTier` junction records

---

## Common Queries

### Find creator by SuiNS name
```typescript
const creator = await prisma.creator.findUnique({
  where: { name: 'alice.sui' }
});
```

### Get all tiers for a creator with subscription counts
```typescript
const tiers = await prisma.tier.findMany({
  where: { creatorId: creatorId },
  include: {
    _count: {
      select: { subscriptions: true }
    }
  }
});
```

### Get active subscriptions for a subscriber
```typescript
const now = new Date();
const subscriptions = await prisma.subscription.findMany({
  where: {
    subscriber: address,
    isActive: true,
    expiresAt: { gte: now }
  },
  include: { tier: { include: { creator: true } } }
});
```

### Get content accessible to a tier
```typescript
const content = await prisma.content.findMany({
  where: {
    OR: [
      { isPublic: true },
      {
        contentTiers: {
          some: { tierId: tierId }
        }
      }
    ]
  }
});
```

---

## Scripts

### Migrate Database
```bash
bun prisma:migrate      # Create and apply migration
```

### Generate Prisma Client
```bash
bun prisma:generate     # Generate TypeScript types
```

### Seed Database
```bash
bun prisma:seed         # Populate with test data
```

### Prisma Studio (GUI)
```bash
bun prisma:studio       # Launch at http://localhost:5555
```

### Validate Schema
```bash
bun src/lib/validate-schema.ts
```

### Test Performance
```bash
bun src/lib/test-db-performance.ts
```

### Test Data Integrity
```bash
bun src/lib/test-data-integrity.ts
```

---

## Migration Workflow

### Development
1. Edit `schema.prisma`
2. Run `bunx prisma migrate dev --name description`
3. Prisma generates migration SQL and updates client
4. Migration applied automatically on server startup

### Production
1. Run `bunx prisma migrate deploy` (no interactive prompts)
2. Only applies pending migrations
3. Server handles this automatically on startup

---

## Performance Notes

- All frequently queried fields are indexed
- Indexed queries average < 10ms
- Complex joins (3+ relations) average < 10ms
- BigInt fields handle large numbers correctly
- Connection pooling handled by Prisma

---

## Important Considerations

1. **BigInt Price Field**: Store prices in MIST (1 SUI = 1,000,000,000 MIST)
2. **Unique Constraints**: Address, profileId, name, tierId, subscriptionId, contentId
3. **Cascade Deletes**: Configured on all foreign keys
4. **Timestamps**: Auto-managed by Prisma (`createdAt`, `updatedAt`)
5. **Optional Fields**: avatarUrl, previewBlobId (can be null)

---

## Testing

All database operations are tested:
- ✅ Unique constraint enforcement
- ✅ Required field validation
- ✅ BigInt price handling
- ✅ Cascade deletes (Creator → Tier → Subscription)
- ✅ Many-to-many relationships (Content ↔ Tier)
- ✅ DateTime field handling
- ✅ Complex queries with multiple joins
- ✅ Index performance (< 10ms)

---

## Files

- `schema.prisma` - Database schema definition
- `seed.ts` - Test data seeder script
- `migrations/` - Migration history (auto-generated)
- `README.md` - This documentation

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
