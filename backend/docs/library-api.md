# Library API Documentation

## Endpoint

`GET /api/library/:creatorAddress`

Get library posts for a creator with filtering, sorting, and pagination.

## URL Parameters

- `creatorAddress` (required): Creator's Sui wallet address

## Query Parameters

| Parameter   | Type   | Default | Description                                              |
|-------------|--------|---------|----------------------------------------------------------|
| `tab`       | string | "posts" | Filter by tab: "posts", "collections", or "drafts"       |
| `search`    | string | -       | Search posts by title (case-insensitive)                 |
| `filter`    | string | -       | Filter by post type: "video", "audio", "image", "text"   |
| `sortBy`    | string | "date"  | Sort by: "date" or "title"                               |
| `sortOrder` | string | "desc"  | Sort order: "asc" or "desc"                              |
| `page`      | number | 1       | Page number (starts at 1)                                |
| `limit`     | number | 20      | Items per page (max: 100)                                |

## Response Format

```typescript
{
  posts: LibraryPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### LibraryPost Type

```typescript
{
  id: string;                                  // Database UUID
  title: string;                              // Post title
  publishDate: Date;                          // Publication or creation date
  tierAccess: "Public" | "Paid";              // Access level
  price?: number;                             // Price in SUI (only for paid posts)
  postType: "text" | "video" | "audio" | "image"; // Media type
  thumbnailUrl?: string;                      // Walrus preview URL
  isDraft: boolean;                           // Draft status
  viewCount?: number;                         // View count
  likeCount?: number;                         // Like count
}
```

## Examples

### Get Published Posts

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?tab=posts
```

Response:
```json
{
  "posts": [
    {
      "id": "ac2c5d27-86ca-43bd-8fba-ba5b555c9bf3",
      "title": "My First Video",
      "publishDate": "2025-11-18T08:58:00.000Z",
      "tierAccess": "Paid",
      "price": 5,
      "postType": "video",
      "thumbnailUrl": "https://aggregator.walrus-testnet.walrus.space/v1/test_preview_1",
      "isDraft": false,
      "viewCount": 150,
      "likeCount": 42
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get Drafts

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?tab=drafts
```

### Search Posts

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?search=video
```

### Filter by Type

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?filter=video
```

### Sort by Title

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?sortBy=title&sortOrder=asc
```

### Pagination

```bash
GET /api/library/0xtest0000000000000000000000000000000000000000000000000000000001?page=2&limit=10
```

## Error Responses

### Creator Not Found (404)

```json
{
  "error": "Creator not found"
}
```

### Internal Server Error (500)

```json
{
  "error": "Internal server error"
}
```

## Database Schema Changes

The following fields were added to the `Content` model:

- `isDraft` (Boolean): Indicates if content is unpublished
- `publishedAt` (DateTime?): Publication timestamp (null for drafts)
- `viewCount` (Int): Number of views
- `likeCount` (Int): Number of likes

Migration: `20251118085402_add_library_fields_to_content`

## Implementation Notes

1. **No Prisma Relations**: The codebase uses manual joins instead of Prisma relations (no foreign keys).

2. **Content Type Mapping**:
   - `video/*` MIME types → `"video"` postType
   - `audio/*` MIME types → `"audio"` postType
   - `image/*` MIME types → `"image"` postType
   - Everything else → `"text"` postType

3. **Tier Access Calculation**:
   - `isPublic = true` → `"Public"`
   - Has linked tiers → `"Paid"`
   - No linked tiers → `"Public"`

4. **Price Conversion**: Prices are stored in MIST (1 SUI = 1,000,000,000 MIST) and converted to SUI for the response.

5. **Collections Tab**: Currently returns empty array (not implemented yet).

6. **Thumbnail URLs**: Preview blobs are served via Walrus aggregator on testnet.

## Testing

Test data seed script is available:

```bash
cd backend
bun -e "const { PrismaClient } = require('@prisma/client'); ..."
```

Run tests:

```bash
cd backend
bun test src/routes/library.test.ts
```
