/**
 * Upload and Download Routes
 *
 * REST API endpoints for content upload to Walrus (with optional Seal encryption)
 * and secure download with optional decryption.
 *
 * Follows SOLID principles:
 * - Single Responsibility: Handles only upload/download HTTP operations
 * - Dependency Inversion: Depends on service abstractions (walrus, seal)
 * - Interface Segregation: Focused route handlers with clear responsibilities
 */

import { Router, Request, Response } from 'express';
import { walrus } from '../services/storage.service';
import { seal } from '../services/encryption.service';

const router = Router();

/**
 * Request body interface for file upload
 */
interface UploadRequest {
  file: string;          // Base64-encoded file content
  contentType: string;   // MIME type of the file
  policyId: string;      // Policy ID for access control
  encrypt?: boolean;     // Whether to encrypt before upload (default: false)
}

/**
 * Response interface for successful upload
 */
interface UploadResponse {
  success: true;
  blobId: string;        // Walrus blob ID
  url: string;           // Public URL to access the blob
  size: number;          // Size of uploaded data in bytes
  encrypted: boolean;    // Whether the data was encrypted
  contentType: string;   // Content type of the file
}

/**
 * Response interface for errors
 */
interface ErrorResponse {
  success: false;
  error: string;         // Human-readable error message
}

/**
 * POST /api/upload
 *
 * Upload file to Walrus with optional Seal encryption
 *
 * Request body:
 * - file: Base64-encoded file content (required)
 * - contentType: MIME type (required)
 * - policyId: Policy ID for access control (required)
 * - encrypt: Whether to encrypt (optional, default: false)
 *
 * Response:
 * - 200: Upload successful
 * - 400: Invalid request (missing fields, invalid base64)
 * - 500: Processing error (encryption/upload failed)
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { file, contentType, policyId, encrypt = false } = req.body as UploadRequest;

    // Validate required fields
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
      } as ErrorResponse);
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Content type is required',
      } as ErrorResponse);
    }

    if (!policyId) {
      return res.status(400).json({
        success: false,
        error: 'Policy ID is required',
      } as ErrorResponse);
    }

    // Decode base64 to Buffer
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(file, 'base64');

      // Validate that it's actually valid base64 by checking if decoding worked properly
      // Buffer.from doesn't throw for invalid base64, it just returns partial/incorrect data
      if (!file.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error('Invalid base64 characters');
      }
    } catch (error) {
      console.error('❌ Base64 decoding failed:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 encoding',
      } as ErrorResponse);
    }

    const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);
    console.log(`📤 Upload started: ${fileSizeKB} KB, type: ${contentType}, encrypt: ${encrypt}`);

    // Step 1: Optionally encrypt the data
    let dataToUpload = fileBuffer;
    if (encrypt) {
      console.log(`🔒 Encrypting with policy: ${policyId}`);
      try {
        dataToUpload = await seal.encrypt(fileBuffer, policyId);
        console.log(`✅ Encryption successful: ${(dataToUpload.length / 1024).toFixed(2)} KB`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown encryption error';
        console.error('❌ Encryption failed:', message);
        return res.status(500).json({
          success: false,
          error: `Encryption failed: ${message}`,
        } as ErrorResponse);
      }
    }

    // Step 2: Upload to Walrus
    console.log(`📤 Uploading to Walrus: ${(dataToUpload.length / 1024).toFixed(2)} KB`);
    let blobId: string;
    try {
      blobId = await walrus.upload(dataToUpload);
      console.log(`✅ Upload successful: ${blobId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('❌ Walrus upload failed:', message);
      return res.status(500).json({
        success: false,
        error: `Upload failed: ${message}`,
      } as ErrorResponse);
    }

    // Step 3: Return success response
    const response: UploadResponse = {
      success: true,
      blobId,
      url: walrus.getUrl(blobId),
      size: dataToUpload.length,
      encrypted: encrypt,
      contentType,
    };

    console.log(`✅ Upload complete: ${blobId} (${fileSizeKB} KB, encrypted: ${encrypt})`);
    return res.status(200).json(response);
  } catch (error) {
    // Catch-all for unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error in upload handler:', error);
    return res.status(500).json({
      success: false,
      error: `Unexpected error: ${message}`,
    } as ErrorResponse);
  }
});

/**
 * GET /api/download/:blobId
 *
 * Download file from Walrus with optional Seal decryption
 *
 * Path parameters:
 * - blobId: Walrus blob ID (required)
 *
 * Query parameters:
 * - decrypt: Whether to decrypt (optional, default: false)
 * - txDigest: Transaction digest for access proof (required if decrypt=true)
 *
 * Response:
 * - 200: Binary data with Content-Type: application/octet-stream
 * - 400: Invalid request (missing txDigest when decrypt=true)
 * - 404: Blob not found
 * - 500: Processing error (decryption/download failed)
 */
router.get('/download/:blobId', async (req: Request, res: Response) => {
  try {
    const { blobId } = req.params;
    const decrypt = req.query.decrypt === 'true';
    const txDigest = req.query.txDigest as string | undefined;

    console.log(`📥 Download request: ${blobId}, decrypt: ${decrypt}`);

    // Validate txDigest if decryption is requested
    if (decrypt && !txDigest) {
      console.error('❌ Missing txDigest for decryption');
      return res.status(400).json({
        success: false,
        error: 'Transaction digest is required for decryption',
      } as ErrorResponse);
    }

    // Step 1: Download from Walrus
    let data: Buffer;
    try {
      data = await walrus.download(blobId);
      console.log(`✅ Download successful: ${blobId} (${(data.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown download error';
      console.error(`❌ Walrus download failed (${blobId}):`, message);

      // Return 404 if blob not found
      if (message.includes('404') || message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: `Blob not found: ${message}`,
        } as ErrorResponse);
      }

      // Return 500 for other errors
      return res.status(500).json({
        success: false,
        error: `Download failed: ${message}`,
      } as ErrorResponse);
    }

    // Step 2: Optionally decrypt the data
    if (decrypt && txDigest) {
      console.log(`🔓 Decrypting with txDigest: ${txDigest}`);
      try {
        // Convert txDigest (hex string) to Uint8Array
        // Remove '0x' prefix if present
        const hexString = txDigest.startsWith('0x') ? txDigest.slice(2) : txDigest;
        const txBytes = Buffer.from(hexString, 'hex');

        data = await seal.decrypt(data, txBytes);
        console.log(`✅ Decryption successful: ${(data.length / 1024).toFixed(2)} KB`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown decryption error';
        console.error('❌ Decryption failed:', message);
        return res.status(500).json({
          success: false,
          error: `Decryption failed: ${message}`,
        } as ErrorResponse);
      }
    }

    // Step 3: Return binary data
    console.log(`✅ Download complete: ${blobId} (${(data.length / 1024).toFixed(2)} KB, decrypted: ${decrypt})`);
    return res
      .status(200)
      .set('Content-Type', 'application/octet-stream')
      .send(data);
  } catch (error) {
    // Catch-all for unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error in download handler:', error);
    return res.status(500).json({
      success: false,
      error: `Unexpected error: ${message}`,
    } as ErrorResponse);
  }
});

/**
 * Export the router for integration with Express app
 */
export default router;
