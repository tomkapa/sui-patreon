# Upload and Download API Documentation

## Base URL
```
http://localhost:3001
```

---

## POST /api/upload

Upload file to Walrus decentralized storage with optional Seal encryption.

### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "file": "string",          // Base64-encoded file content (required)
  "contentType": "string",   // MIME type, e.g., "image/png", "text/plain" (required)
  "policyId": "string",      // On-chain policy ID for access control (required)
  "encrypt": boolean         // Whether to encrypt with Seal (optional, default: false)
}
```

### Response (200 OK)

```json
{
  "success": true,
  "blobId": "string",        // Walrus blob ID - use this to download
  "url": "string",           // Public URL to access the blob
  "size": number,            // Size of uploaded data in bytes
  "encrypted": boolean,      // Whether the data was encrypted
  "contentType": "string"    // Content type of the file
}
```

### Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": "File is required" | "Content type is required" | "Policy ID is required" | "Invalid base64 encoding"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Encryption failed: <reason>" | "Upload failed: <reason>"
}
```

### Examples

#### Upload Text File (No Encryption)
```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file": "SGVsbG8sIFdhbHJ1cyE=",
    "contentType": "text/plain",
    "policyId": "0x123abc",
    "encrypt": false
  }'
```

#### Upload Image (With Encryption)
```bash
# First, convert image to base64
IMAGE_BASE64=$(base64 -i image.png)

curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d "{
    \"file\": \"$IMAGE_BASE64\",
    \"contentType\": \"image/png\",
    \"policyId\": \"0x123abc\",
    \"encrypt\": true
  }"
```

#### JavaScript/TypeScript Example
```typescript
async function uploadFile(file: File, policyId: string, encrypt: boolean = false) {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });

  // Upload to API
  const response = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: base64,
      contentType: file.type,
      policyId,
      encrypt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
const file = document.querySelector('input[type="file"]').files[0];
const result = await uploadFile(file, '0x123abc', true);
console.log('Uploaded:', result.blobId);
console.log('URL:', result.url);
```

---

## GET /api/download/:blobId

Download file from Walrus with optional Seal decryption.

### Request

**Path Parameters**:
- `blobId`: Walrus blob ID (required)

**Query Parameters**:
- `decrypt`: Whether to decrypt the data (`true` or `false`, optional, default: `false`)
- `txDigest`: Transaction digest proving access rights (required if `decrypt=true`)

### Response (200 OK)

**Headers**:
```
Content-Type: application/octet-stream
```

**Body**: Binary data (file content)

### Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Transaction digest is required for decryption"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Blob not found: <reason>"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Download failed: <reason>" | "Decryption failed: <reason>"
}
```

### Examples

#### Download Without Decryption
```bash
curl http://localhost:3001/api/download/abc123def456 \
  -o downloaded-file.bin
```

#### Download With Decryption
```bash
curl "http://localhost:3001/api/download/abc123def456?decrypt=true&txDigest=0x789ghi" \
  -o decrypted-file.bin
```

#### JavaScript/TypeScript Example
```typescript
async function downloadFile(blobId: string, decrypt: boolean = false, txDigest?: string) {
  // Build URL with query parameters
  const params = new URLSearchParams();
  if (decrypt) {
    if (!txDigest) {
      throw new Error('txDigest is required when decrypt=true');
    }
    params.set('decrypt', 'true');
    params.set('txDigest', txDigest);
  }

  const url = `http://localhost:3001/api/download/${blobId}?${params}`;

  // Fetch binary data
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  // Return as Blob for browser download
  return await response.blob();
}

// Usage: Download and trigger browser download
const blob = await downloadFile('abc123def456', true, '0x789ghi');
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'file.bin';
a.click();
URL.revokeObjectURL(url);

// Usage: Download and display image
const blob = await downloadFile('abc123def456');
const url = URL.createObjectURL(blob);
const img = document.querySelector('img');
img.src = url;
```

#### React Example
```tsx
import { useState } from 'react';

function FileUploadDownload() {
  const [blobId, setBlobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      // Upload
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          contentType: file.type,
          policyId: '0x123abc',
          encrypt: true,
        }),
      });

      const result = await response.json();
      setBlobId(result.blobId);
      alert('Upload successful!');
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!blobId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/download/${blobId}?decrypt=true&txDigest=0x789ghi`
      );

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'downloaded-file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Upload to Walrus</h2>
      <input type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {blobId && (
        <div>
          <p>Blob ID: {blobId}</p>
          <button onClick={handleDownload}>Download</button>
        </div>
      )}
    </div>
  );
}
```

---

## Complete Upload → Download Workflow

### 1. Upload Encrypted Content
```bash
# Prepare file
echo "Secret content for premium subscribers" > premium-content.txt
FILE_BASE64=$(base64 -i premium-content.txt)

# Upload with encryption
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d "{
    \"file\": \"$FILE_BASE64\",
    \"contentType\": \"text/plain\",
    \"policyId\": \"0xPolicyId123\",
    \"encrypt\": true
  }" | jq
```

**Response**:
```json
{
  "success": true,
  "blobId": "abc123def456",
  "url": "https://aggregator.walrus-testnet.walrus.space/v1/abc123def456",
  "size": 124,
  "encrypted": true,
  "contentType": "text/plain"
}
```

### 2. Download and Decrypt Content
```bash
# Requires valid transaction proof
curl "http://localhost:3001/api/download/abc123def456?decrypt=true&txDigest=0xTransactionProof" \
  -o decrypted-content.txt

cat decrypted-content.txt
# Output: Secret content for premium subscribers
```

---

## Notes

### Base64 Encoding
- All files must be base64-encoded before upload
- Use standard base64 encoding (A-Z, a-z, 0-9, +, /, =)
- Remove any data URL prefixes (e.g., `data:image/png;base64,`)

### File Size Limits
- Maximum request body size: **50MB**
- Configured in `express.json({ limit: '50mb' })`
- Includes base64 overhead (~33% size increase)

### Encryption
- Uses Seal SDK for identity-based encryption
- Requires `policyId` parameter (on-chain policy object ID)
- Decryption requires proof of access via `txDigest`
- Key servers: Threshold encryption (2-of-3 by default)

### Storage Duration
- Default: 100 epochs (~100 days on testnet)
- Configurable in service layer
- Renewable before expiration

### Transaction Digest Format
- Format: `0x` + 64 hex characters
- Example: `0x123abc456def789...`
- Must be a valid Sui transaction that proves access rights
- Obtained from blockchain after successful access policy verification

### Content Types
Common MIME types:
- Text: `text/plain`, `text/html`, `text/csv`
- Images: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
- Video: `video/mp4`, `video/webm`
- Audio: `audio/mp3`, `audio/wav`
- Binary: `application/octet-stream`
- JSON: `application/json`
- PDF: `application/pdf`

### Error Handling
All error responses follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Security Considerations
1. **Validate Input**: Always validate `policyId` and ensure it matches your access policy
2. **HTTPS Only**: Use HTTPS in production
3. **Rate Limiting**: Implement rate limiting for production use
4. **File Validation**: Validate file types and sizes on client-side before upload
5. **Transaction Proof**: Never expose private keys; transaction proofs are public
6. **CORS**: Configure appropriate CORS origins for production

---

## Testing

### Run Test Suite
```bash
cd backend
bun test src/routes/upload.test.ts
```

**Expected Output**: 18 tests passing ✓

### Manual Testing
```bash
# 1. Start server
cd backend
bun run dev

# 2. Test upload
curl -X POST http://localhost:3001/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file": "SGVsbG8gV29ybGQ=",
    "contentType": "text/plain",
    "policyId": "0x123",
    "encrypt": false
  }'

# 3. Test download (replace BLOB_ID with actual blob ID from upload response)
curl http://localhost:3001/api/download/BLOB_ID
```

---

## Troubleshooting

### Upload Fails with "Invalid base64"
**Solution**: Ensure base64 string only contains valid characters (A-Z, a-z, 0-9, +, /, =)

### Download Returns 404
**Solution**: Verify blob ID is correct and blob exists in Walrus

### Encryption/Decryption Takes Too Long
**Expected**: 3-5 seconds for key server operations
**Solution**: Use upload relay for production (reduces network requests)

### CORS Error in Browser
**Solution**: Ensure backend CORS is configured for your frontend origin:
```typescript
// backend/src/index.ts
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
}));
```

---

## Related Documentation

- [Walrus Documentation](https://docs.wal.app)
- [Seal Encryption Documentation](https://seal-docs.wal.app)
- [Sui Blockchain Documentation](https://docs.sui.io)
- Backend Implementation: `backend/src/routes/upload.ts`
- Test Suite: `backend/src/routes/upload.test.ts`
