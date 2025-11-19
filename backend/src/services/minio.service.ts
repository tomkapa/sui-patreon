/**
 * MinIO Public Bucket Storage Service
 *
 * Simple service for uploading avatar images to a public MinIO bucket.
 * The bucket is pre-configured and publicly accessible for reads.
 *
 * Configuration required:
 * - MINIO_PUBLIC_URL: Base URL of the public bucket (e.g., https://minio.7k.ag/sui-patreon)
 */

import { randomUUID } from 'crypto';

/**
 * Allowed image MIME types for avatar uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/**
 * MinIO Public Bucket Storage
 *
 * Handles upload of avatar images to a public bucket via direct HTTP uploads.
 * Files are publicly readable once uploaded.
 */
export class MinioStorage {
  private readonly publicUrl: string;

  /**
   * Initialize MinIO storage with public bucket URL
   *
   * @param publicUrl - Base URL of the public bucket
   * @throws Error if publicUrl is not provided
   */
  constructor(publicUrl: string) {
    if (!publicUrl) {
      throw new Error('MINIO_PUBLIC_URL is required');
    }

    this.publicUrl = publicUrl.replace(/\/$/, ''); // Remove trailing slash

    console.log('✅ MinIO Storage initialized', {
      publicUrl: this.publicUrl,
    });
  }

  /**
   * Validate that the content type is an allowed image format
   *
   * @param contentType - MIME type to validate
   * @returns true if valid, false otherwise
   */
  private isValidImageType(contentType: string): contentType is AllowedMimeType {
    return ALLOWED_MIME_TYPES.includes(contentType as AllowedMimeType);
  }

  /**
   * Generate a unique filename for an uploaded image
   *
   * @param contentType - MIME type of the image
   * @returns Unique filename with appropriate extension
   *
   * @example
   * ```typescript
   * const filename = generateUniqueFilename('image/jpeg');
   * // Returns: 'f47ac10b-58cc-4372-a567-0e02b2c3d479-1234567890.jpg'
   * ```
   */
  private generateUniqueFilename(contentType: AllowedMimeType): string {
    const uuid = randomUUID();
    const timestamp = Date.now();
    const extension = this.getFileExtension(contentType);

    return `${uuid}-${timestamp}.${extension}`;
  }

  /**
   * Get file extension from content type
   *
   * @param contentType - MIME type
   * @returns File extension (jpg, png)
   */
  private getFileExtension(contentType: AllowedMimeType): string {
    const extensionMap: Record<AllowedMimeType, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
    };

    return extensionMap[contentType];
  }

  /**
   * Upload an avatar image to MinIO public bucket via HTTP PUT
   *
   * @param buffer - Image data as Buffer
   * @param contentType - MIME type of the image
   * @returns Promise resolving to object with filename and URL
   * @throws Error if content type is invalid or upload fails
   *
   * @example
   * ```typescript
   * const result = await minio.uploadAvatar(imageBuffer, 'image/jpeg');
   * console.log(`Uploaded: ${result.url}`);
   * ```
   */
  async uploadAvatar(
    buffer: Buffer,
    contentType: string
  ): Promise<{ filename: string; url: string }> {
    // Validate content type
    if (!this.isValidImageType(contentType)) {
      throw new Error(
        `Invalid image type: ${contentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    const filename = this.generateUniqueFilename(contentType);
    const url = this.getAvatarUrl(filename);
    const sizeKB = (buffer.length / 1024).toFixed(2);

    console.log(`📤 MinIO upload started: ${filename} (${sizeKB} KB, type: ${contentType})`);

    try {
      // Upload via HTTP PUT to the public bucket
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
        },
        body: buffer,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ MinIO upload successful: ${filename}`);

      return { filename, url };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ MinIO upload failed (${filename}):`, message);
      throw new Error(`MinIO upload failed: ${message}`);
    }
  }

  /**
   * Download an avatar image from MinIO public bucket
   *
   * @param filename - The filename to download
   * @returns Promise resolving to a Buffer containing the image data
   * @throws Error if download fails or file doesn't exist
   *
   * @example
   * ```typescript
   * const imageData = await minio.downloadAvatar('avatar-123.jpg');
   * console.log(`Downloaded ${imageData.length} bytes`);
   * ```
   */
  async downloadAvatar(filename: string): Promise<Buffer> {
    const url = this.getAvatarUrl(filename);

    console.log(`📥 MinIO download started: ${filename}`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Avatar not found: ${filename}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const sizeKB = (buffer.length / 1024).toFixed(2);

      console.log(`✅ MinIO download successful: ${filename} (${sizeKB} KB)`);

      return buffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ MinIO download failed (${filename}):`, message);
      throw error;
    }
  }

  /**
   * Get the public URL for an avatar
   *
   * @param filename - The filename
   * @returns The public URL to access the avatar
   *
   * @example
   * ```typescript
   * const url = minio.getAvatarUrl('avatar-123.jpg');
   * // Returns: https://minio.7k.ag/sui-patreon/avatar-123.jpg
   * ```
   */
  getAvatarUrl(filename: string): string {
    return `${this.publicUrl}/${filename}`;
  }

  /**
   * Check if an avatar exists in MinIO public bucket
   *
   * @param filename - The filename to check
   * @returns Promise resolving to true if avatar exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await minio.avatarExists('avatar-123.jpg');
   * if (exists) {
   *   console.log('Avatar is available');
   * }
   * ```
   */
  async avatarExists(filename: string): Promise<boolean> {
    const url = this.getAvatarUrl(filename);

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const exists = response.ok;

      console.log(`🔍 MinIO avatar ${filename}: ${exists ? 'exists' : 'not found'}`);

      return exists;
    } catch (error) {
      console.log(`🔍 MinIO avatar ${filename}: not found`);
      return false;
    }
  }
}

/**
 * Load MinIO public URL from environment
 *
 * @throws Error if MINIO_PUBLIC_URL is not set
 */
function loadPublicUrl(): string {
  const publicUrl = process.env.MINIO_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error(
      'Missing MINIO_PUBLIC_URL environment variable. ' +
      'Example: MINIO_PUBLIC_URL=https://minio.7k.ag/sui-patreon'
    );
  }

  return publicUrl;
}

/**
 * Singleton instance of MinioStorage for application-wide use
 *
 * Import this instance to use MinIO storage throughout your application:
 * ```typescript
 * import { minio } from './services/minio.service';
 *
 * const result = await minio.uploadAvatar(buffer, 'image/jpeg');
 * ```
 */
export const minio = new MinioStorage(loadPublicUrl());
