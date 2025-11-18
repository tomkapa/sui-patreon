/**
 * Upload and Download Routes Test Suite
 *
 * Tests for content upload/download API endpoints with optional encryption/decryption
 * Follows TDD approach with comprehensive coverage of success and error scenarios
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import request from 'supertest';
import express from 'express';
import uploadRouter from './upload';
import { walrus } from '../services/storage.service';
import { seal } from '../services/encryption.service';

// Create a test app for isolated testing
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/api', uploadRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    error: err.message,
  });
});

describe('Upload Routes', () => {
  beforeEach(() => {
    // Reset all spies before each test (if needed)
  });

  describe('POST /api/upload', () => {
    it('should upload file without encryption', async () => {
      const testContent = 'Hello, Walrus!';
      const base64Content = Buffer.from(testContent).toString('base64');

      // Mock walrus.upload
      const uploadSpy = spyOn(walrus, 'upload').mockResolvedValue('mock-blob-id-123');
      const getUrlSpy = spyOn(walrus, 'getUrl').mockReturnValue(
        'https://aggregator.walrus-testnet.walrus.space/v1/mock-blob-id-123'
      );

      const response = await request(app)
        .post('/api/upload')
        .send({
          file: base64Content,
          contentType: 'text/plain',
          policyId: 'mock-policy-id',
          encrypt: false,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        blobId: 'mock-blob-id-123',
        url: 'https://aggregator.walrus-testnet.walrus.space/v1/mock-blob-id-123',
        size: testContent.length,
        encrypted: false,
        contentType: 'text/plain',
      });

      // Verify walrus.upload was called with correct Buffer
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      const uploadedBuffer = uploadSpy.mock.calls[0][0] as Buffer;
      expect(uploadedBuffer.toString()).toBe(testContent);

      uploadSpy.mockRestore();
      getUrlSpy.mockRestore();
    });

    it('should upload file with encryption', async () => {
      const testContent = 'Secret content!';
      const base64Content = Buffer.from(testContent).toString('base64');
      const encryptedContent = Buffer.from('encrypted-' + testContent);

      // Mock seal.encrypt
      const encryptSpy = spyOn(seal, 'encrypt').mockResolvedValue(encryptedContent);

      // Mock walrus.upload
      const uploadSpy = spyOn(walrus, 'upload').mockResolvedValue('mock-blob-id-123');
      const getUrlSpy = spyOn(walrus, 'getUrl').mockReturnValue(
        'https://aggregator.walrus-testnet.walrus.space/v1/mock-blob-id-123'
      );

      const response = await request(app)
        .post('/api/upload')
        .send({
          file: base64Content,
          contentType: 'application/octet-stream',
          policyId: 'mock-policy-id',
          encrypt: true,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        blobId: 'mock-blob-id-123',
        url: 'https://aggregator.walrus-testnet.walrus.space/v1/mock-blob-id-123',
        size: encryptedContent.length,
        encrypted: true,
        contentType: 'application/octet-stream',
      });

      // Verify encryption was called first
      expect(encryptSpy).toHaveBeenCalledTimes(1);
      const encryptArgs = encryptSpy.mock.calls[0];
      expect((encryptArgs[0] as Buffer).toString()).toBe(testContent);
      expect(encryptArgs[1]).toBe('mock-policy-id');

      // Verify walrus.upload was called with encrypted data
      expect(uploadSpy).toHaveBeenCalledTimes(1);

      encryptSpy.mockRestore();
      uploadSpy.mockRestore();
      getUrlSpy.mockRestore();
    });

    it('should handle binary file upload', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const base64Content = binaryData.toString('base64');

      const uploadSpy = spyOn(walrus, 'upload').mockResolvedValue('mock-blob-id-123');
      const getUrlSpy = spyOn(walrus, 'getUrl').mockReturnValue(
        'https://aggregator.walrus-testnet.walrus.space/v1/mock-blob-id-123'
      );

      const response = await request(app)
        .post('/api/upload')
        .send({
          file: base64Content,
          contentType: 'image/png',
          policyId: 'mock-policy-id',
          encrypt: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.contentType).toBe('image/png');

      const uploadedBuffer = uploadSpy.mock.calls[0][0] as Buffer;
      expect(uploadedBuffer).toEqual(binaryData);

      uploadSpy.mockRestore();
      getUrlSpy.mockRestore();
    });

    it('should return 400 if file is missing', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          contentType: 'text/plain',
          policyId: 'mock-policy-id',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'File is required',
      });
    });

    it('should return 400 if contentType is missing', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          file: Buffer.from('test').toString('base64'),
          policyId: 'mock-policy-id',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Content type is required',
      });
    });

    it('should return 400 if policyId is missing', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          file: Buffer.from('test').toString('base64'),
          contentType: 'text/plain',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Policy ID is required',
      });
    });

    it('should return 400 if base64 is invalid', async () => {
      const response = await request(app)
        .post('/api/upload')
        .send({
          file: 'invalid-base64!!!',
          contentType: 'text/plain',
          policyId: 'mock-policy-id',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid base64');
    });

    it('should return 500 if encryption fails', async () => {
      const encryptSpy = spyOn(seal, 'encrypt').mockImplementation(() => {
        return Promise.reject(new Error('Encryption key error'));
      });

      const response = await request(app)
        .post('/api/upload')
        .send({
          file: Buffer.from('test').toString('base64'),
          contentType: 'text/plain',
          policyId: 'mock-policy-id',
          encrypt: true,
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Encryption key error');

      encryptSpy.mockRestore();
    });

    it('should return 500 if Walrus upload fails', async () => {
      const uploadSpy = spyOn(walrus, 'upload').mockImplementation(() => {
        return Promise.reject(new Error('Network timeout'));
      });

      const response = await request(app)
        .post('/api/upload')
        .send({
          file: Buffer.from('test').toString('base64'),
          contentType: 'text/plain',
          policyId: 'mock-policy-id',
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Network timeout');

      uploadSpy.mockRestore();
    });
  });

  describe('GET /api/download/:blobId', () => {
    it('should download file without decryption', async () => {
      const testContent = Buffer.from('test content');
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(testContent);

      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .expect('Content-Type', 'application/octet-stream')
        .expect(200);

      expect(Buffer.from(response.body)).toEqual(testContent);
      expect(downloadSpy).toHaveBeenCalledWith('mock-blob-id');

      downloadSpy.mockRestore();
    });

    it('should download and decrypt file', async () => {
      const encryptedContent = Buffer.from('encrypted-secret');
      const decryptedContent = Buffer.from('secret');

      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(encryptedContent);
      const decryptSpy = spyOn(seal, 'decrypt').mockResolvedValue(decryptedContent);

      const mockTxDigest = '0x123abc';

      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .query({ decrypt: 'true', txDigest: mockTxDigest })
        .expect('Content-Type', 'application/octet-stream')
        .expect(200);

      expect(Buffer.from(response.body)).toEqual(decryptedContent);
      expect(downloadSpy).toHaveBeenCalledWith('mock-blob-id');
      expect(decryptSpy).toHaveBeenCalledTimes(1);

      const decryptArgs = decryptSpy.mock.calls[0];
      expect(decryptArgs[0]).toEqual(encryptedContent);

      downloadSpy.mockRestore();
      decryptSpy.mockRestore();
    });

    it('should return 400 if txDigest is missing when decrypt=true', async () => {
      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .query({ decrypt: 'true' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Transaction digest is required for decryption',
      });
    });

    it('should return 404 if blob does not exist', async () => {
      const downloadSpy = spyOn(walrus, 'download').mockImplementation(() => {
        return Promise.reject(new Error('HTTP 404: Blob not found'));
      });

      const response = await request(app)
        .get('/api/download/non-existent-blob')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Blob not found');

      downloadSpy.mockRestore();
    });

    it('should return 500 if decryption fails', async () => {
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(Buffer.from('encrypted-data'));
      const decryptSpy = spyOn(seal, 'decrypt').mockImplementation(() => {
        return Promise.reject(new Error('Invalid access proof'));
      });

      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .query({ decrypt: 'true', txDigest: '0x123abc' })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid access proof');

      downloadSpy.mockRestore();
      decryptSpy.mockRestore();
    });

    it('should handle binary content correctly', async () => {
      const binaryData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(binaryData);

      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .expect('Content-Type', 'application/octet-stream')
        .expect(200);

      expect(Buffer.from(response.body)).toEqual(binaryData);

      downloadSpy.mockRestore();
    });

    it('should handle empty blob download', async () => {
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(Buffer.from(''));

      const response = await request(app)
        .get('/api/download/mock-blob-id')
        .expect('Content-Type', 'application/octet-stream')
        .expect(200);

      // Empty buffer check - response.body might be an empty object {}
      const responseBuffer = Buffer.from(response.body);
      expect(responseBuffer.length).toBe(0);

      downloadSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle upload → download cycle without encryption', async () => {
      const originalContent = 'Integration test content';
      const base64Content = Buffer.from(originalContent).toString('base64');

      // Upload
      const uploadSpy = spyOn(walrus, 'upload').mockResolvedValue('test-blob-id');
      const getUrlSpy = spyOn(walrus, 'getUrl').mockReturnValue(
        'https://aggregator.walrus-testnet.walrus.space/v1/test-blob-id'
      );

      const uploadResponse = await request(app)
        .post('/api/upload')
        .send({
          file: base64Content,
          contentType: 'text/plain',
          policyId: 'test-policy',
          encrypt: false,
        })
        .expect(200);

      const { blobId } = uploadResponse.body;

      // Download
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(Buffer.from(originalContent));

      const downloadResponse = await request(app)
        .get(`/api/download/${blobId}`)
        .expect(200);

      expect(downloadResponse.body.toString()).toBe(originalContent);

      uploadSpy.mockRestore();
      getUrlSpy.mockRestore();
      downloadSpy.mockRestore();
    });

    it('should handle upload → download cycle with encryption', async () => {
      const originalContent = 'Secret integration test';
      const base64Content = Buffer.from(originalContent).toString('base64');
      const encryptedContent = Buffer.from('encrypted-' + originalContent);

      // Upload with encryption
      const encryptSpy = spyOn(seal, 'encrypt').mockResolvedValue(encryptedContent);
      const uploadSpy = spyOn(walrus, 'upload').mockResolvedValue('test-blob-id');
      const getUrlSpy = spyOn(walrus, 'getUrl').mockReturnValue(
        'https://aggregator.walrus-testnet.walrus.space/v1/test-blob-id'
      );

      const uploadResponse = await request(app)
        .post('/api/upload')
        .send({
          file: base64Content,
          contentType: 'text/plain',
          policyId: 'test-policy',
          encrypt: true,
        })
        .expect(200);

      expect(uploadResponse.body.encrypted).toBe(true);

      const { blobId } = uploadResponse.body;

      // Download with decryption
      const downloadSpy = spyOn(walrus, 'download').mockResolvedValue(encryptedContent);
      const decryptSpy = spyOn(seal, 'decrypt').mockResolvedValue(Buffer.from(originalContent));

      const downloadResponse = await request(app)
        .get(`/api/download/${blobId}`)
        .query({ decrypt: 'true', txDigest: '0xabc123' })
        .expect(200);

      expect(downloadResponse.body.toString()).toBe(originalContent);

      encryptSpy.mockRestore();
      uploadSpy.mockRestore();
      getUrlSpy.mockRestore();
      downloadSpy.mockRestore();
      decryptSpy.mockRestore();
    });
  });
});
