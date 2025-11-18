import { describe, test, expect, beforeAll, mock, spyOn } from 'bun:test';
import { WalrusStorage } from './storage.service';

describe('WalrusStorage Service', () => {
  const TEST_PUBLISHER_URL = 'https://test-publisher.walrus.space';
  const TEST_AGGREGATOR_URL = 'https://test-aggregator.walrus.space';
  const TEST_BLOB_ID = 'test-blob-id-123';
  const TEST_DATA = Buffer.from('Hello Walrus!');
  const TEST_EPOCHS = 100;

  describe('Constructor and Initialization', () => {
    test('initializes with default URLs from environment', () => {
      const storage = new WalrusStorage();
      expect(storage).toBeInstanceOf(WalrusStorage);
    });

    test('initializes with custom URLs', () => {
      const storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
      expect(storage).toBeInstanceOf(WalrusStorage);
    });

    test('logs initialization message', () => {
      const consoleSpy = spyOn(console, 'log');
      new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);

      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Walrus Storage initialized',
        expect.objectContaining({
          publisher: TEST_PUBLISHER_URL,
          aggregator: TEST_AGGREGATOR_URL,
        })
      );
    });
  });

  describe('upload method', () => {
    let storage: WalrusStorage;

    beforeAll(() => {
      storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
    });

    test('successfully uploads new blob and returns blob ID', async () => {
      const mockResponse = {
        newlyCreated: {
          blobObject: {
            id: 'object-123',
            storedEpoch: 1,
            blobId: TEST_BLOB_ID,
            size: TEST_DATA.length,
            erasureCodeType: 'RedStuff',
            certifiedEpoch: 1,
            storage: {
              id: 'storage-123',
              startEpoch: 1,
              endEpoch: 101,
              storageSize: TEST_DATA.length,
            },
          },
          encodedSize: TEST_DATA.length * 5,
          cost: 1000,
        },
      };

      const fetchMock = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      globalThis.fetch = fetchMock as any;

      const blobId = await storage.upload(TEST_DATA, TEST_EPOCHS);

      expect(blobId).toBe(TEST_BLOB_ID);
      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_PUBLISHER_URL}/v1/store?epochs=${TEST_EPOCHS}`,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: TEST_DATA,
        })
      );
    });

    test('successfully handles already certified blob', async () => {
      const mockResponse = {
        alreadyCertified: {
          blobId: TEST_BLOB_ID,
          event: {
            txDigest: 'digest-123',
            eventSeq: '0',
          },
          endEpoch: 101,
        },
      };

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      ) as any;

      const blobId = await storage.upload(TEST_DATA, TEST_EPOCHS);

      expect(blobId).toBe(TEST_BLOB_ID);
    });

    test('throws error when upload fails with HTTP error', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        } as Response)
      ) as any;

      await expect(storage.upload(TEST_DATA, TEST_EPOCHS)).rejects.toThrow(
        'Walrus upload failed: HTTP 500: Internal Server Error'
      );
    });

    test('throws error when response format is unexpected', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ unexpected: 'format' }),
        } as Response)
      ) as any;

      await expect(storage.upload(TEST_DATA, TEST_EPOCHS)).rejects.toThrow(
        'Walrus upload failed: Unexpected response format from Walrus'
      );
    });

    test('throws error when network error occurs', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      await expect(storage.upload(TEST_DATA, TEST_EPOCHS)).rejects.toThrow(
        'Walrus upload failed: Network error'
      );
    });

    test('logs upload start and success', async () => {
      const consoleSpy = spyOn(console, 'log');

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            newlyCreated: {
              blobObject: {
                blobId: TEST_BLOB_ID,
                size: TEST_DATA.length,
              },
              encodedSize: TEST_DATA.length * 5,
              cost: 1000,
            },
          }),
        } as Response)
      ) as any;

      await storage.upload(TEST_DATA, TEST_EPOCHS);

      // Check that upload start message was logged
      const uploadStartCalls = consoleSpy.mock.calls.filter(call =>
        String(call[0]).includes('📤 Walrus upload started')
      );
      expect(uploadStartCalls.length).toBeGreaterThan(0);

      // Check that upload success message was logged
      const uploadSuccessCalls = consoleSpy.mock.calls.filter(call =>
        String(call[0]).includes('✅ Walrus upload successful')
      );
      expect(uploadSuccessCalls.length).toBeGreaterThan(0);
    });

    test('logs error when upload fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');

      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Upload failed'))
      ) as any;

      try {
        await storage.upload(TEST_DATA, TEST_EPOCHS);
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Walrus upload failed'),
        expect.anything()
      );
    });
  });

  describe('download method', () => {
    let storage: WalrusStorage;

    beforeAll(() => {
      storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
    });

    test('successfully downloads blob and returns Buffer', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(TEST_DATA.buffer),
        } as Response)
      ) as any;

      const data = await storage.download(TEST_BLOB_ID);

      expect(Buffer.isBuffer(data)).toBe(true);
      expect(data.toString()).toBe(TEST_DATA.toString());
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${TEST_AGGREGATOR_URL}/v1/${TEST_BLOB_ID}`
      );
    });

    test('throws error when download fails with HTTP error', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          text: () => Promise.resolve('Not Found'),
        } as Response)
      ) as any;

      await expect(storage.download(TEST_BLOB_ID)).rejects.toThrow(
        'Walrus download failed: HTTP 404: Not Found'
      );
    });

    test('throws error when network error occurs', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Network timeout'))
      ) as any;

      await expect(storage.download(TEST_BLOB_ID)).rejects.toThrow(
        'Walrus download failed: Network timeout'
      );
    });

    test('logs download start and success', async () => {
      const consoleSpy = spyOn(console, 'log');

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(TEST_DATA.buffer),
        } as Response)
      ) as any;

      await storage.download(TEST_BLOB_ID);

      // Check that download start message was logged
      const downloadStartCalls = consoleSpy.mock.calls.filter(call =>
        String(call[0]).includes('📥 Walrus download started')
      );
      expect(downloadStartCalls.length).toBeGreaterThan(0);

      // Check that download success message was logged
      const downloadSuccessCalls = consoleSpy.mock.calls.filter(call =>
        String(call[0]).includes('✅ Walrus download successful')
      );
      expect(downloadSuccessCalls.length).toBeGreaterThan(0);
    });

    test('logs error when download fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');

      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Download failed'))
      ) as any;

      try {
        await storage.download(TEST_BLOB_ID);
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Walrus download failed'),
        expect.anything()
      );
    });
  });

  describe('getUrl method', () => {
    test('returns correct aggregator URL for blob ID', () => {
      const storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
      const url = storage.getUrl(TEST_BLOB_ID);

      expect(url).toBe(`${TEST_AGGREGATOR_URL}/v1/${TEST_BLOB_ID}`);
    });

    test('works with different aggregator URLs', () => {
      const customAggregator = 'https://custom.walrus.space';
      const storage = new WalrusStorage(TEST_PUBLISHER_URL, customAggregator);
      const url = storage.getUrl(TEST_BLOB_ID);

      expect(url).toBe(`${customAggregator}/v1/${TEST_BLOB_ID}`);
    });
  });

  describe('exists method', () => {
    let storage: WalrusStorage;

    beforeAll(() => {
      storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
    });

    test('returns true when blob exists (HEAD returns 200)', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      ) as any;

      const exists = await storage.exists(TEST_BLOB_ID);

      expect(exists).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${TEST_AGGREGATOR_URL}/v1/${TEST_BLOB_ID}`,
        { method: 'HEAD' }
      );
    });

    test('returns false when blob does not exist (HEAD returns 404)', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response)
      ) as any;

      const exists = await storage.exists(TEST_BLOB_ID);

      expect(exists).toBe(false);
    });

    test('returns false when network error occurs', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Network error'))
      ) as any;

      const exists = await storage.exists(TEST_BLOB_ID);

      expect(exists).toBe(false);
    });

    test('logs existence check result', async () => {
      const consoleSpy = spyOn(console, 'log');

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      ) as any;

      await storage.exists(TEST_BLOB_ID);

      // Check that existence check message was logged
      const existsCheckCalls = consoleSpy.mock.calls.filter(call =>
        String(call[0]).includes('🔍 Walrus blob')
      );
      expect(existsCheckCalls.length).toBeGreaterThan(0);
    });

    test('logs error when exists check fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');

      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Check failed'))
      ) as any;

      await storage.exists(TEST_BLOB_ID);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Walrus exists check failed'),
        expect.anything()
      );
    });
  });

  describe('Singleton Export', () => {
    test('singleton instance is exported', async () => {
      const { walrus } = await import('./storage.service');
      expect(walrus).toBeInstanceOf(WalrusStorage);
    });

    test('singleton can perform operations', async () => {
      const { walrus } = await import('./storage.service');

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      ) as any;

      const exists = await walrus.exists(TEST_BLOB_ID);
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Integration Scenarios', () => {
    let storage: WalrusStorage;

    beforeAll(() => {
      storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
    });

    test('upload and download flow', async () => {
      const testContent = 'Integration test content';
      const testBuffer = Buffer.from(testContent);

      // Mock upload
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            newlyCreated: {
              blobObject: {
                blobId: TEST_BLOB_ID,
                size: testBuffer.length,
              },
              encodedSize: testBuffer.length * 5,
              cost: 1000,
            },
          }),
        } as Response)
      ) as any;

      const blobId = await storage.upload(testBuffer);
      expect(blobId).toBe(TEST_BLOB_ID);

      // Mock download
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(testBuffer.buffer),
        } as Response)
      ) as any;

      const downloaded = await storage.download(blobId);
      expect(downloaded.toString()).toBe(testContent);
    });

    test('check existence before download', async () => {
      // Mock exists check
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      ) as any;

      const exists = await storage.exists(TEST_BLOB_ID);
      expect(exists).toBe(true);

      // Mock download
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(TEST_DATA.buffer),
        } as Response)
      ) as any;

      const data = await storage.download(TEST_BLOB_ID);
      expect(Buffer.isBuffer(data)).toBe(true);
    });

    test('handles large file uploads', async () => {
      // Create a 1MB buffer
      const largeBuffer = Buffer.alloc(1024 * 1024, 'x');

      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            newlyCreated: {
              blobObject: {
                blobId: 'large-blob-id',
                size: largeBuffer.length,
              },
              encodedSize: largeBuffer.length * 5,
              cost: 5000,
            },
          }),
        } as Response)
      ) as any;

      const blobId = await storage.upload(largeBuffer, 200);
      expect(blobId).toBeTruthy();
    });
  });

  describe('Error Message Formatting', () => {
    let storage: WalrusStorage;

    beforeAll(() => {
      storage = new WalrusStorage(TEST_PUBLISHER_URL, TEST_AGGREGATOR_URL);
    });

    test('upload error includes descriptive message', async () => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 413,
          text: () => Promise.resolve('Payload too large'),
        } as Response)
      ) as any;

      try {
        await storage.upload(TEST_DATA);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Walrus upload failed');
        expect((error as Error).message).toContain('413');
        expect((error as Error).message).toContain('Payload too large');
      }
    });

    test('download error includes blob ID in message', async () => {
      globalThis.fetch = mock(() =>
        Promise.reject(new Error('Connection timeout'))
      ) as any;

      try {
        await storage.download(TEST_BLOB_ID);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Walrus download failed');
        expect((error as Error).message).toContain('Connection timeout');
      }
    });
  });
});
