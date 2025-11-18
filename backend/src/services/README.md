# Backend Services

## Walrus Storage Service

The `storage.service.ts` provides a simple interface for interacting with Walrus decentralized storage.

### Quick Start

```typescript
import { walrus } from './services/storage.service';

// Upload a file
const fileBuffer = Buffer.from('Hello from Walrus!');
const blobId = await walrus.upload(fileBuffer, 100); // 100 epochs (~100 days)
console.log(`Uploaded: ${blobId}`);

// Download a file
const data = await walrus.download(blobId);
console.log(`Downloaded: ${data.toString()}`);

// Get public URL
const url = walrus.getUrl(blobId);
console.log(`Access at: ${url}`);

// Check if blob exists
const exists = await walrus.exists(blobId);
console.log(`Blob exists: ${exists}`);
```

### API Reference

#### `upload(data: Buffer, epochs?: number): Promise<string>`

Uploads data to Walrus storage.

- **Parameters:**
  - `data`: Buffer containing the data to upload
  - `epochs`: Number of epochs to store (default: 100, ~100 days on testnet)
- **Returns:** Promise resolving to the blob ID
- **Throws:** Error if upload fails

**Example:**
```typescript
const imageBuffer = await fs.readFile('image.png');
const blobId = await walrus.upload(imageBuffer, 200);
```

#### `download(blobId: string): Promise<Buffer>`

Downloads data from Walrus storage.

- **Parameters:**
  - `blobId`: The blob ID to download
- **Returns:** Promise resolving to a Buffer containing the data
- **Throws:** Error if download fails or blob doesn't exist

**Example:**
```typescript
const data = await walrus.download('your-blob-id');
await fs.writeFile('downloaded.png', data);
```

#### `getUrl(blobId: string): string`

Gets the public URL for a blob.

- **Parameters:**
  - `blobId`: The blob ID
- **Returns:** The public URL to access the blob

**Example:**
```typescript
const url = walrus.getUrl('your-blob-id');
// https://aggregator.walrus-testnet.walrus.space/v1/your-blob-id
```

#### `exists(blobId: string): Promise<boolean>`

Checks if a blob exists in storage.

- **Parameters:**
  - `blobId`: The blob ID to check
- **Returns:** Promise resolving to true if blob exists, false otherwise

**Example:**
```typescript
if (await walrus.exists('your-blob-id')) {
  console.log('Blob is available');
}
```

### Express Integration Example

```typescript
import express from 'express';
import { walrus } from './services/storage.service';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const blobId = await walrus.upload(req.file.buffer);

    res.json({
      success: true,
      blobId,
      url: walrus.getUrl(blobId),
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Download endpoint
app.get('/api/download/:blobId', async (req, res) => {
  try {
    const { blobId } = req.params;

    // Check if blob exists
    const exists = await walrus.exists(blobId);
    if (!exists) {
      return res.status(404).json({ error: 'Blob not found' });
    }

    // Download and return
    const data = await walrus.download(blobId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(data);
  } catch (error) {
    console.error('Download failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get blob info endpoint
app.get('/api/blob/:blobId/info', async (req, res) => {
  try {
    const { blobId } = req.params;
    const exists = await walrus.exists(blobId);

    res.json({
      success: true,
      blobId,
      exists,
      url: exists ? walrus.getUrl(blobId) : null,
    });
  } catch (error) {
    console.error('Info check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

### Configuration

The service reads configuration from environment variables:

```env
# Walrus Storage
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

### Error Handling

All methods throw descriptive errors that should be caught and handled:

```typescript
try {
  const blobId = await walrus.upload(data);
} catch (error) {
  console.error('Upload failed:', error);
  // Error message includes context: "Walrus upload failed: HTTP 500: ..."
}
```

### Logging

The service logs all operations to the console:

- 📤 Upload started with size and epochs
- ✅ Upload successful with blob ID and metadata
- 📥 Download started with blob ID
- ✅ Download successful with size
- 🔍 Blob existence check results
- ❌ Error messages with context

### Testing

Run tests with:

```bash
bun test src/services/storage.service.test.ts
```

The test suite includes:
- Upload/download operations
- Error handling scenarios
- URL generation
- Blob existence checks
- Integration scenarios
- Large file handling (1MB+)

### Best Practices

1. **Check existence before download** to avoid unnecessary network calls
2. **Set appropriate epochs** based on content lifecycle (100 epochs ≈ 100 days on testnet)
3. **Handle errors gracefully** and provide user feedback
4. **Log operations** for debugging and monitoring
5. **Use the singleton instance** (`walrus`) to avoid multiple initializations

### Performance Considerations

- **Upload time**: Depends on file size and network conditions
- **Download time**: Generally fast due to Walrus's CDN-like architecture
- **Existence checks**: Very fast (HEAD request only)
- **Large files**: Tested up to 50MB (Express body parser limit)

### Production Deployment

For production, consider:

1. **Switch to mainnet** URLs in environment variables
2. **Monitor storage costs** (epochs × size)
3. **Implement retry logic** for transient network errors
4. **Add rate limiting** on upload endpoints
5. **Cache blob existence** checks if queried frequently
6. **Set up logging aggregation** for operational insights

### Troubleshooting

#### Upload fails with "413 Payload Too Large"

Increase Express body parser limit or reduce file size before upload.

#### Download fails with "404 Not Found"

Blob may have expired (epochs elapsed) or never existed. Check blob ID.

#### "Network timeout" errors

Check internet connection and Walrus network status. Implement retry logic.

#### Slow uploads

Large files take longer. Consider chunking or using upload progress feedback.

---

For more information, see the [Walrus documentation](https://docs.wal.app).
