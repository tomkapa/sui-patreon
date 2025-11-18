# Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive statistics, activity metrics, and content management functionality for creator dashboards.

## Endpoint

```
GET /api/dashboard
```

## Authentication

Currently uses `MOCK_WALLET_ADDRESS` from environment variables for testing. In production, this should be replaced with proper authentication middleware.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `creatorAddress` | string | `MOCK_WALLET_ADDRESS` | Sui wallet address of the creator |
| `type` | string | `"all"` | Filter by media type: `"all"`, `"image"`, `"video"`, `"audio"`, `"text"` |
| `tier` | string | `"all"` | Filter by tier ID or `"all"` for all tiers |
| `time` | string | `"all"` | Filter by time period: `"all"`, `"7days"`, `"30days"` |
| `search` | string | - | Search posts by title (case-insensitive) |
| `cursor` | string | - | Pagination cursor (content ID to start after) |
| `limit` | number | `20` | Number of posts per page (max: 100) |

## Response Structure

```typescript
{
  overview: {
    totalMembers: number;      // Count of active subscribers
    totalRevenue: string;      // Total revenue in SUI (formatted as decimal)
  };
  activity: {
    commentsCount: number;     // Comments in last 30 days (not yet implemented)
    likesCount: number;        // Total likes across all content
    impressionsCount: number;  // Page visits in last 30 days
  };
  recentPost: {
    id: string;
    title: string;
    mediaType: "video" | "audio" | "image" | "text";
    mediaUrls: string[];       // Walrus aggregator URLs
    audience: "free" | "paid";
    createdAt: string;         // ISO 8601 timestamp
    viewCount: number;
    likeCount: number;
  } | null;
  recentPosts: Array<{
    id: string;
    title: string;
    mediaType: "video" | "audio" | "image" | "text";
    mediaUrls: string[];       // Walrus aggregator URLs
    audience: "free" | "paid";
    tierNames: string[];       // Names of tiers with access
    createdAt: string;         // ISO 8601 timestamp
    viewCount: number;
    likeCount: number;
  }>;
  cursor: string | null;       // Next cursor for pagination
  hasMore: boolean;            // Whether more results exist
}
```

## Examples

### Basic Request

```bash
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abec7f223edeb5120fab9c0cc133db6167145937fd1261777e5eeab0e87f966"
```

### Filter by Video Content

```bash
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&type=video"
```

### Filter by Time Period

```bash
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&time=7days"
```

### Search Posts

```bash
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&search=tutorial"
```

### Pagination

```bash
# First page
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&limit=20"

# Next page (use cursor from previous response)
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&limit=20&cursor=uuid-here"
```

### Combined Filters

```bash
curl "http://localhost:3001/api/dashboard?creatorAddress=0x1abe...&type=video&time=30days&limit=10"
```

## Response Examples

### Success Response (200 OK)

```json
{
  "overview": {
    "totalMembers": 42,
    "totalRevenue": "350.00"
  },
  "activity": {
    "commentsCount": 0,
    "likesCount": 156,
    "impressionsCount": 1203
  },
  "recentPost": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Latest Tutorial",
    "mediaType": "video",
    "mediaUrls": [
      "https://aggregator.walrus-testnet.walrus.space/v1/preview_blob_id",
      "https://aggregator.walrus-testnet.walrus.space/v1/main_blob_id"
    ],
    "audience": "paid",
    "createdAt": "2025-11-18T12:00:00.000Z",
    "viewCount": 234,
    "likeCount": 45
  },
  "recentPosts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "My Latest Tutorial",
      "mediaType": "video",
      "mediaUrls": [
        "https://aggregator.walrus-testnet.walrus.space/v1/preview_blob_id",
        "https://aggregator.walrus-testnet.walrus.space/v1/main_blob_id"
      ],
      "audience": "paid",
      "tierNames": ["Premium", "VIP"],
      "createdAt": "2025-11-18T12:00:00.000Z",
      "viewCount": 234,
      "likeCount": 45
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Free Introduction",
      "mediaType": "text",
      "mediaUrls": [
        "https://aggregator.walrus-testnet.walrus.space/v1/text_blob_id"
      ],
      "audience": "free",
      "tierNames": [],
      "createdAt": "2025-11-17T10:30:00.000Z",
      "viewCount": 502,
      "likeCount": 78
    }
  ],
  "cursor": "660e8400-e29b-41d4-a716-446655440001",
  "hasMore": true
}
```

### Creator Not Found (404)

```json
{
  "error": "Creator not found"
}
```

### Invalid Request (400)

```json
{
  "error": "Missing or invalid creatorAddress parameter"
}
```

### Server Error (500)

```json
{
  "error": "Internal server error"
}
```

## Implementation Notes

### Overview Statistics

- **totalMembers**: Counts active, non-expired subscriptions across all creator's tiers
- **totalRevenue**: Sums up all subscription payments (active and expired). Calculated by multiplying tier price by subscription count. Converted from MIST to SUI (1 SUI = 1,000,000,000 MIST)

### Activity Metrics

- **commentsCount**: Currently returns 0 (comments not yet implemented in schema)
- **likesCount**: Sum of `likeCount` from all non-draft content
- **impressionsCount**: Count of visits to creator profile in last 30 days (from `Visit` table)

### Recent Posts

- Only includes published content (`isDraft: false`, `publishedAt: not null`)
- Ordered by `publishedAt` descending (newest first)
- Supports cursor-based pagination for efficient large dataset handling
- Draft content is excluded from all queries

### Media URLs

- Primary URL: Walrus blob ID for the main content
- Preview URL: Optional preview/thumbnail blob ID (if available)
- Format: `https://aggregator.walrus-testnet.walrus.space/v1/{blobId}`

### Audience Classification

- **free**: Content is public (`isPublic: true`) or has no tier restrictions
- **paid**: Content requires subscription to specific tier(s)

### Tier Filtering

When `tier` parameter is specified (not "all"), the API filters content by tier access:
- Queries `ContentTier` junction table to find content linked to the specified tier
- Only returns content that has access granted to that tier

## Database Schema Dependencies

The dashboard API queries the following tables:

- **Creator**: Creator profile information
- **Tier**: Subscription tier details and pricing
- **Subscription**: Active and expired subscriptions
- **Content**: Published content items
- **ContentTier**: Junction table linking content to tiers
- **Visit**: Page visit tracking for impressions

## Performance Considerations

1. **Pagination**: Uses cursor-based pagination (ID-based) for efficient querying of large datasets
2. **Eager Loading**: Fetches tier information in batch queries to avoid N+1 problems
3. **Indexing**: Relies on database indexes on:
   - `Creator.address`
   - `Content.creatorId`
   - `Content.publishedAt`
   - `Subscription.tierId`
   - `Visit.creatorId` and `Visit.visitedAt`

## Future Enhancements

1. **Comments**: Implement comment system and update `commentsCount` calculation
2. **Caching**: Add Redis caching for overview statistics (updated on blockchain events)
3. **Real-time Updates**: WebSocket support for live dashboard updates
4. **Advanced Analytics**:
   - Revenue over time (daily/weekly/monthly)
   - Subscriber growth charts
   - Content performance metrics
   - Engagement rate calculations
5. **Export Functionality**: CSV/PDF export of dashboard data
6. **Custom Date Ranges**: Allow arbitrary date range filters beyond preset options

## Testing

Comprehensive test suite available at `src/routes/dashboard.test.ts`:

- Overview statistics calculation
- Activity metrics (30-day window)
- Recent post fetching
- Filtering by type, tier, time
- Search functionality
- Cursor-based pagination
- Edge cases (empty data, non-existent creator)

Run tests:
```bash
bun test src/routes/dashboard.test.ts
```

## Security Notes

1. **Production Authentication**: Replace `MOCK_WALLET_ADDRESS` with proper authentication
2. **Rate Limiting**: Implement rate limiting per creator address
3. **Input Validation**: All query parameters are validated and sanitized
4. **SQL Injection**: Protected via Prisma's parameterized queries
5. **Access Control**: Verify requesting user is the creator or has admin privileges
