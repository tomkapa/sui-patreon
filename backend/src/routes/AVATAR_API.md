# Avatar Upload API Documentation

## Overview

The Avatar API provides endpoints for uploading and retrieving user avatar images using MinIO object storage. It supports JPEG, JPG, and PNG image formats with automatic file validation, unique filename generation, and public URL access.

## Endpoints

### POST /api/avatar/upload

Upload a new avatar image to MinIO storage.

**Request Body:**

```json
{
  "file": "base64-encoded-image-data",
  "contentType": "image/jpeg" | "image/jpg" | "image/png"
}
```

**Request Example:**

```bash
curl -X POST http://localhost:3001/api/avatar/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "contentType": "image/png"
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "filename": "f47ac10b-58cc-4372-a567-0e02b2c3d479-1700000000000.png",
  "url": "http://localhost:9000/avatars/f47ac10b-58cc-4372-a567-0e02b2c3d479-1700000000000.png",
  "size": 68,
  "contentType": "image/png"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | File is required | Missing `file` field in request body |
| 400 | Content type is required | Missing `contentType` field in request body |
| 400 | Invalid content type | Content type is not `image/jpeg`, `image/jpg`, or `image/png` |
| 400 | Invalid base64 encoding | File data is not valid base64 |
| 400 | File too small to be a valid image | File size is less than 100 bytes |
| 400 | File too large. Maximum size is 10MB | File exceeds 10MB size limit |
| 500 | Upload failed | MinIO upload operation failed |

---

### GET /api/avatar/:filename

Retrieve an avatar image from MinIO storage.

**Path Parameters:**

- `filename` (string, required): The unique filename returned from the upload endpoint

**Request Example:**

```bash
curl http://localhost:3001/api/avatar/f47ac10b-58cc-4372-a567-0e02b2c3d479-1700000000000.png
```

**Success Response (200 OK):**

Binary image data with appropriate headers:

```
Content-Type: image/png | image/jpeg
Cache-Control: public, max-age=31536000
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Filename is required | Missing filename in URL path |
| 400 | Invalid filename format | Filename doesn't match expected pattern |
| 404 | Avatar not found | Avatar doesn't exist in MinIO |
| 500 | Download failed | MinIO download operation failed |

---

## TypeScript/JavaScript Client Example

```typescript
// Upload avatar
async function uploadAvatar(imageFile: File): Promise<string> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(imageFile);
  });

  // Upload to backend
  const response = await fetch('http://localhost:3001/api/avatar/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64,
      contentType: imageFile.type,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.url; // Return the public URL
}

// Download avatar (browser)
function displayAvatar(filename: string, imgElement: HTMLImageElement) {
  imgElement.src = `http://localhost:3001/api/avatar/${filename}`;
}

// Usage example
const fileInput = document.querySelector<HTMLInputElement>('#avatar-input')!;
fileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const url = await uploadAvatar(file);
    console.log('Avatar uploaded:', url);

    // Display the uploaded avatar
    const img = document.querySelector<HTMLImageElement>('#avatar-preview')!;
    img.src = url;
  } catch (error) {
    console.error('Upload failed:', error);
  }
});
```

---

## React Example

```tsx
import { useState } from 'react';

function AvatarUploader() {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG or PNG image');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload
      const response = await fetch('http://localhost:3001/api/avatar/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          contentType: file.type,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setAvatarUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {avatarUrl && (
        <div>
          <img src={avatarUrl} alt="Avatar" style={{ maxWidth: 200 }} />
          <p>Avatar URL: {avatarUrl}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Filename Format

Uploaded avatars use a unique filename format:

```
{uuid}-{timestamp}.{extension}
```

Example: `f47ac10b-58cc-4372-a567-0e02b2c3d479-1700000000000.png`

- **UUID**: Random UUID v4 for uniqueness
- **Timestamp**: Unix timestamp in milliseconds
- **Extension**: `jpg` for JPEG/JPG, `png` for PNG

This format ensures:
- Unique filenames prevent collisions
- Chronological sorting by timestamp
- Easy extension detection

---

## Environment Configuration

Required environment variables in `.env`:

```bash
# MinIO Object Storage (for avatar uploads)
MINIO_ENDPOINT=localhost        # MinIO server endpoint
MINIO_PORT=9000                 # MinIO server port
MINIO_ACCESS_KEY=minioadmin     # MinIO access key
MINIO_SECRET_KEY=minioadmin     # MinIO secret key
MINIO_BUCKET_NAME=avatars       # Bucket name for avatars
MINIO_USE_SSL=false             # Use HTTPS (true/false)
```

---

## MinIO Setup

### Local Development (Docker)

```bash
# Run MinIO with Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

Access MinIO Console at: http://localhost:9001

### Using Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  minio:
    image: quay.io/minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  minio_data:
```

Then run: `docker-compose up -d`

---

## Security Considerations

### File Validation

1. **Content Type**: Only `image/jpeg`, `image/jpg`, and `image/png` are allowed
2. **Base64 Validation**: Ensures data is properly encoded
3. **Size Limits**:
   - Minimum: 100 bytes (prevents invalid images)
   - Maximum: 10MB (prevents abuse)

### Filename Security

- Generated server-side (UUID + timestamp)
- No user input in filename
- Prevents path traversal attacks
- Validated with strict regex pattern

### Public Access

- Avatars are publicly accessible via URL
- Do not upload sensitive images
- Consider implementing access control if needed

---

## Performance Optimization

### Caching

Avatars are served with long-term cache headers:

```
Cache-Control: public, max-age=31536000
```

This allows browsers to cache avatars for 1 year.

### CDN Integration

For production, consider:
1. Use MinIO with a CDN (CloudFront, Cloudflare, etc.)
2. Update `MINIO_ENDPOINT` to CDN URL
3. Enable SSL (`MINIO_USE_SSL=true`)

### Image Optimization

Before uploading, consider:
- Resizing images to appropriate dimensions (e.g., 512x512)
- Compressing images to reduce file size
- Converting to WebP format (requires API update)

---

## Testing

Run the test suite:

```bash
# All tests
bun test

# Avatar routes tests only
bun test src/routes/avatar.test.ts

# MinIO service tests only
bun test src/services/minio.service.test.ts
```

**Note**: Tests require a running MinIO instance.

---

## Troubleshooting

### Connection Errors

```
Error: MinIO bucket initialization failed: connect ECONNREFUSED
```

**Solution**: Ensure MinIO is running and accessible:
```bash
docker ps | grep minio
curl http://localhost:9000
```

### Permission Errors

```
Error: Access Denied
```

**Solution**: Verify MinIO credentials in `.env` match the running instance.

### Upload Fails with Large Files

```
Error: File too large. Maximum size is 10MB
```

**Solution**: Either:
1. Reduce image size before upload
2. Increase limit in `avatar.ts` (update `maxSize` constant)

---

## API Changelog

### v1.0.0 (Current)
- Initial release
- POST `/api/avatar/upload` endpoint
- GET `/api/avatar/:filename` endpoint
- Support for JPEG, JPG, PNG formats
- 10MB file size limit
- Unique filename generation
- Public read access

---

## Future Enhancements

- [ ] WebP format support
- [ ] Image resizing/cropping
- [ ] Thumbnail generation
- [ ] Direct file upload (multipart/form-data)
- [ ] Authenticated access control
- [ ] Avatar deletion endpoint
- [ ] Batch upload support
- [ ] Image metadata extraction (dimensions, format, etc.)
