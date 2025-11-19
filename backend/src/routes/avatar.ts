/**
 * Avatar Upload and Download Routes
 *
 * REST API endpoints for avatar image management using MinIO storage.
 *
 * Endpoints:
 * - POST /api/avatar/upload - Upload avatar image to MinIO
 * - GET /api/avatar/:filename - Retrieve/serve avatar image from MinIO
 *
 * Follows SOLID principles:
 * - Single Responsibility: Handles only avatar HTTP operations
 * - Dependency Inversion: Depends on MinIO service abstraction
 * - Interface Segregation: Focused route handlers with clear responsibilities
 */

import { Router, Request, Response } from 'express';
import { minio } from '../services/minio.service';

const router = Router();

/**
 * Request body interface for avatar upload
 */
interface AvatarUploadRequest {
  file: string;         // Base64-encoded image content
  contentType: string;  // MIME type (image/jpeg, image/jpg, image/png)
}

/**
 * Response interface for successful upload
 */
interface AvatarUploadResponse {
  success: true;
  filename: string;     // Unique filename in MinIO
  url: string;          // Public URL to access the avatar
  size: number;         // Size of uploaded image in bytes
  contentType: string;  // Content type of the image
}

/**
 * Response interface for errors
 */
interface ErrorResponse {
  success: false;
  error: string;        // Human-readable error message
}

/**
 * POST /api/avatar/upload
 *
 * Upload an avatar image to MinIO storage
 *
 * Request body:
 * - file: Base64-encoded image content (required)
 * - contentType: MIME type - must be image/jpeg, image/jpg, or image/png (required)
 *
 * Response:
 * - 200: Upload successful, returns filename and URL
 * - 400: Invalid request (missing fields, invalid base64, unsupported image type)
 * - 500: Processing error (upload failed)
 *
 * @example Request
 * ```json
 * {
 *   "file": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
 *   "contentType": "image/png"
 * }
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "filename": "f47ac10b-58cc-4372-a567-0e02b2c3d479-1234567890.png",
 *   "url": "http://localhost:9000/avatars/f47ac10b-58cc-4372-a567-0e02b2c3d479-1234567890.png",
 *   "size": 1234,
 *   "contentType": "image/png"
 * }
 * ```
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { file, contentType } = req.body as AvatarUploadRequest;

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

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid content type: ${contentType}. Allowed types: ${allowedTypes.join(', ')}`,
      } as ErrorResponse);
    }

    // Decode base64 to Buffer
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(file, 'base64');

      // Validate that it's actually valid base64
      if (!file.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error('Invalid base64 characters');
      }

      // Validate minimum size (at least 100 bytes for a valid image)
      if (fileBuffer.length < 100) {
        throw new Error('File too small to be a valid image');
      }

      // Validate maximum size (10MB limit for avatars)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > maxSize) {
        throw new Error('File too large. Maximum size is 10MB');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid base64 encoding';
      console.error('❌ Base64 decoding failed:', message);
      return res.status(400).json({
        success: false,
        error: message,
      } as ErrorResponse);
    }

    const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);
    console.log(`📤 Avatar upload started: ${fileSizeKB} KB, type: ${contentType}`);

    // Upload to MinIO
    let result: { filename: string; url: string };
    try {
      result = await minio.uploadAvatar(fileBuffer, contentType);
      console.log(`✅ Avatar upload successful: ${result.filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('❌ MinIO upload failed:', message);
      return res.status(500).json({
        success: false,
        error: `Upload failed: ${message}`,
      } as ErrorResponse);
    }

    // Return success response
    const response: AvatarUploadResponse = {
      success: true,
      filename: result.filename,
      url: result.url,
      size: fileBuffer.length,
      contentType,
    };

    console.log(`✅ Avatar upload complete: ${result.filename} (${fileSizeKB} KB)`);
    return res.status(200).json(response);
  } catch (error) {
    // Catch-all for unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error in avatar upload handler:', error);
    return res.status(500).json({
      success: false,
      error: `Unexpected error: ${message}`,
    } as ErrorResponse);
  }
});

/**
 * GET /api/avatar/:filename
 *
 * Retrieve and serve an avatar image from MinIO storage
 *
 * Path parameters:
 * - filename: The unique filename of the avatar (required)
 *
 * Response:
 * - 200: Binary image data with appropriate Content-Type header
 * - 400: Invalid request (missing or invalid filename)
 * - 404: Avatar not found
 * - 500: Processing error (download failed)
 *
 * @example Request
 * ```
 * GET /api/avatar/f47ac10b-58cc-4372-a567-0e02b2c3d479-1234567890.png
 * ```
 *
 * @example Response Headers
 * ```
 * Content-Type: image/png
 * Cache-Control: public, max-age=31536000
 * ```
 */
router.get('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename parameter
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required',
      } as ErrorResponse);
    }

    // Validate filename format (UUID-timestamp.ext)
    const filenameRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-\d+\.(jpg|jpeg|png)$/i;
    if (!filenameRegex.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename format',
      } as ErrorResponse);
    }

    console.log(`📥 Avatar download request: ${filename}`);

    // Download from MinIO
    let imageBuffer: Buffer;
    let contentType: string;
    try {
      imageBuffer = await minio.downloadAvatar(filename);

      // Determine content type from file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

      console.log(`✅ Avatar download successful: ${filename} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown download error';
      console.error(`❌ MinIO download failed (${filename}):`, message);

      // Return 404 if avatar not found
      if (message.includes('not found') || message.includes('NoSuchKey')) {
        return res.status(404).json({
          success: false,
          error: `Avatar not found: ${filename}`,
        } as ErrorResponse);
      }

      // Return 500 for other errors
      return res.status(500).json({
        success: false,
        error: `Download failed: ${message}`,
      } as ErrorResponse);
    }

    // Return binary image data
    console.log(`✅ Avatar served: ${filename} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
    return res
      .status(200)
      .set('Content-Type', contentType)
      .set('Cache-Control', 'public, max-age=31536000') // 1 year cache
      .send(imageBuffer);
  } catch (error) {
    // Catch-all for unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error in avatar download handler:', error);
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
