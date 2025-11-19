/**
 * MinIO Public Bucket Storage Service - Test Suite
 *
 * Tests for simplified MinIO avatar storage using direct HTTP requests.
 *
 * Test coverage:
 * - Avatar upload via HTTP PUT
 * - Avatar download via HTTP GET
 * - Avatar existence check via HTTP HEAD
 * - Content type validation
 * - Unique filename generation
 * - Public URL generation
 * - Error handling
 *
 * Note: These tests require the public bucket to be accessible.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { MinioStorage } from './minio.service';

describe('MinioStorage', () => {
  let minio: MinioStorage;
  let testFilename: string;

  // Use public bucket URL from environment or test default
  const publicUrl = process.env.MINIO_PUBLIC_URL || 'https://minio.7k.ag/sui-patreon';

  beforeAll(() => {
    minio = new MinioStorage(publicUrl);
  });

  describe('constructor', () => {
    test('should initialize with public URL', () => {
      expect(minio).toBeDefined();
      expect(minio.getAvatarUrl('test.jpg')).toBe(`${publicUrl}/test.jpg`);
    });

    test('should throw error if public URL is empty', () => {
      expect(() => new MinioStorage('')).toThrow('MINIO_PUBLIC_URL is required');
    });

    test('should remove trailing slash from public URL', () => {
      const minioWithSlash = new MinioStorage('https://example.com/bucket/');
      expect(minioWithSlash.getAvatarUrl('test.jpg')).toBe('https://example.com/bucket/test.jpg');
    });
  });

  describe('uploadAvatar', () => {
    test('should upload a valid PNG image', async () => {
      // 1x1 transparent PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const result = await minio.uploadAvatar(pngBuffer, 'image/png');

      expect(result).toMatchObject({
        filename: expect.stringMatching(/^[a-f0-9-]+-\d+\.png$/),
        url: expect.stringContaining(publicUrl),
      });

      testFilename = result.filename;

      // Verify file is accessible
      const exists = await minio.avatarExists(testFilename);
      expect(exists).toBe(true);
    });

    test('should upload a valid JPEG image', async () => {
      // Minimal JPEG
      const jpegBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYAA//2Q==',
        'base64'
      );

      const result = await minio.uploadAvatar(jpegBuffer, 'image/jpeg');

      expect(result).toMatchObject({
        filename: expect.stringMatching(/^[a-f0-9-]+-\d+\.jpg$/),
        url: expect.stringContaining(publicUrl),
      });
    });

    test('should reject invalid content type', async () => {
      const buffer = Buffer.from('test data');

      await expect(minio.uploadAvatar(buffer, 'text/plain')).rejects.toThrow(
        'Invalid image type'
      );
    });

    test('should reject unsupported image format', async () => {
      const buffer = Buffer.from('test data');

      await expect(minio.uploadAvatar(buffer, 'image/gif')).rejects.toThrow(
        'Invalid image type'
      );
    });
  });

  describe('downloadAvatar', () => {
    test('should download an existing avatar', async () => {
      // First upload a test image
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const { filename } = await minio.uploadAvatar(testBuffer, 'image/png');

      // Download and verify
      const downloadedBuffer = await minio.downloadAvatar(filename);

      expect(downloadedBuffer).toBeInstanceOf(Buffer);
      expect(downloadedBuffer.length).toBeGreaterThan(0);
    });

    test('should throw error for non-existent avatar', async () => {
      const fakeFilename = 'non-existent-file.jpg';

      await expect(minio.downloadAvatar(fakeFilename)).rejects.toThrow(
        'Avatar not found'
      );
    });
  });

  describe('getAvatarUrl', () => {
    test('should generate correct public URL', () => {
      const filename = 'test-avatar-123.jpg';
      const url = minio.getAvatarUrl(filename);

      expect(url).toBe(`${publicUrl}/${filename}`);
    });

    test('should handle filenames with special characters', () => {
      const filename = 'avatar-123-abc_def.png';
      const url = minio.getAvatarUrl(filename);

      expect(url).toContain(filename);
    });
  });

  describe('avatarExists', () => {
    test('should return true for existing avatar', async () => {
      // Upload a test avatar first
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const { filename } = await minio.uploadAvatar(testBuffer, 'image/png');

      const exists = await minio.avatarExists(filename);
      expect(exists).toBe(true);
    });

    test('should return false for non-existent avatar', async () => {
      const exists = await minio.avatarExists('definitely-does-not-exist.jpg');
      expect(exists).toBe(false);
    });
  });

  describe('filename generation', () => {
    test('should generate unique filenames', async () => {
      const buffer = Buffer.from('test');

      const result1 = await minio.uploadAvatar(buffer, 'image/png');
      const result2 = await minio.uploadAvatar(buffer, 'image/png');

      expect(result1.filename).not.toBe(result2.filename);
    });

    test('should include correct extension for content type', async () => {
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const pngResult = await minio.uploadAvatar(buffer, 'image/png');
      expect(pngResult.filename).toMatch(/\.png$/);

      const jpegBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYAA//2Q==',
        'base64'
      );
      const jpegResult = await minio.uploadAvatar(jpegBuffer, 'image/jpeg');
      expect(jpegResult.filename).toMatch(/\.jpg$/);
    });

    test('should follow UUID-timestamp pattern', async () => {
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const { filename } = await minio.uploadAvatar(buffer, 'image/png');

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-timestamp.ext
      const pattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-\d+\.png$/;
      expect(filename).toMatch(pattern);
    });
  });

  describe('error handling', () => {
    test('should handle network errors gracefully', async () => {
      // Create instance with invalid URL
      const badMinio = new MinioStorage('https://invalid-domain-that-does-not-exist.com/bucket');
      const buffer = Buffer.from('test');

      await expect(badMinio.uploadAvatar(buffer, 'image/png')).rejects.toThrow();
    });
  });
});
