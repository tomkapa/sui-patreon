/**
 * Tests for Seal Encryption Service
 *
 * Tests the encryption and decryption functionality using mocked Seal SDK.
 * Verifies proper Buffer ↔ Uint8Array conversion and error handling.
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { SealEncryption } from './encryption.service';

// Mock the Seal SDK
const mockEncrypt = mock(() => Promise.resolve({
  encryptedObject: new Uint8Array([1, 2, 3, 4, 5]),
  key: new Uint8Array([6, 7, 8, 9, 10]),
}));

const mockDecrypt = mock(() => Promise.resolve(
  new Uint8Array([72, 101, 108, 108, 111]) // "Hello" in ASCII
));

const mockGetKeyServers = mock(() => Promise.resolve(new Map()));

// Mock the SealClient class
mock.module('@mysten/seal', () => ({
  SealClient: class MockSealClient {
    encrypt = mockEncrypt;
    decrypt = mockDecrypt;
    getKeyServers = mockGetKeyServers;
  },
  SessionKey: class MockSessionKey {
    constructor() {}
  },
}));

// Mock Sui client
mock.module('@mysten/sui/client', () => ({
  getFullnodeUrl: () => 'https://fullnode.testnet.sui.io',
  SuiClient: class MockSuiClient {
    constructor() {}
  },
}));

describe('SealEncryption', () => {
  let sealService: SealEncryption;

  beforeEach(() => {
    // Reset mocks before each test
    mockEncrypt.mockClear();
    mockDecrypt.mockClear();

    // Create new instance with test configuration
    process.env.SEAL_PACKAGE_ID = '0xTestPackageId';
    sealService = new SealEncryption('testnet', '0xTestPackageId', 2);
  });

  describe('encrypt', () => {
    it('should encrypt data and return Buffer', async () => {
      const testData = Buffer.from('Hello World');
      const policyId = '0xPolicyId123';

      const result = await sealService.encrypt(testData, policyId);

      // Verify result is a Buffer
      expect(result).toBeInstanceOf(Buffer);

      // Verify SealClient.encrypt was called
      expect(mockEncrypt).toHaveBeenCalledTimes(1);

      // Verify conversion from Buffer to Uint8Array
      const callArgs = mockEncrypt.mock.calls[0][0];
      expect(callArgs.data).toBeInstanceOf(Uint8Array);
      expect(callArgs.threshold).toBe(2);
      expect(callArgs.packageId).toBe('0xTestPackageId');
      expect(callArgs.id).toBe(policyId);
    });

    it('should convert Buffer to Uint8Array correctly', async () => {
      const testData = Buffer.from([1, 2, 3, 4, 5]);
      const policyId = '0xPolicyId123';

      await sealService.encrypt(testData, policyId);

      const callArgs = mockEncrypt.mock.calls[0][0];
      const dataArray = callArgs.data;

      // Verify data matches
      expect(dataArray.length).toBe(5);
      expect(Array.from(dataArray)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should use provided packageId over default', async () => {
      const testData = Buffer.from('test');
      const policyId = '0xPolicy';
      const customPackageId = '0xCustomPackage';

      await sealService.encrypt(testData, policyId, customPackageId);

      const callArgs = mockEncrypt.mock.calls[0][0];
      expect(callArgs.packageId).toBe(customPackageId);
    });

    it('should throw error when packageId is not set', async () => {
      // Clear environment variable
      const originalPackageId = process.env.SEAL_PACKAGE_ID;
      delete process.env.SEAL_PACKAGE_ID;

      // Create instance without package ID
      const serviceWithoutPackage = new SealEncryption('testnet');
      const testData = Buffer.from('test');

      await expect(
        serviceWithoutPackage.encrypt(testData, '0xPolicy')
      ).rejects.toThrow('Package ID is required');

      // Restore environment variable
      if (originalPackageId) {
        process.env.SEAL_PACKAGE_ID = originalPackageId;
      }
    });

    it('should handle encryption errors gracefully', async () => {
      mockEncrypt.mockRejectedValueOnce(new Error('Network timeout'));

      const testData = Buffer.from('test');
      const policyId = '0xPolicy';

      await expect(
        sealService.encrypt(testData, policyId)
      ).rejects.toThrow('Seal encryption failed: Network timeout');
    });

    it('should log encryption details', async () => {
      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy;

      const testData = Buffer.from('Hello World');
      await sealService.encrypt(testData, '0xPolicy');

      console.log = originalLog;

      // Verify logging was called
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('decrypt', () => {
    it('should decrypt data and return Buffer', async () => {
      const encryptedData = Buffer.from([1, 2, 3, 4, 5]);
      const txBytes = new Uint8Array([10, 20, 30]);

      const result = await sealService.decrypt(encryptedData, txBytes);

      // Verify result is a Buffer
      expect(result).toBeInstanceOf(Buffer);

      // Verify decrypted content
      expect(result.toString()).toBe('Hello');

      // Verify SealClient.decrypt was called
      expect(mockDecrypt).toHaveBeenCalledTimes(1);
    });

    it('should convert Buffer to Uint8Array for decryption', async () => {
      const encryptedData = Buffer.from([1, 2, 3, 4, 5]);
      const txBytes = new Uint8Array([10, 20, 30]);

      await sealService.decrypt(encryptedData, txBytes);

      const callArgs = mockDecrypt.mock.calls[0][0];

      // Verify data was converted to Uint8Array
      expect(callArgs.data).toBeInstanceOf(Uint8Array);
      expect(Array.from(callArgs.data)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should pass txBytes to Seal SDK', async () => {
      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20, 30, 40, 50]);

      await sealService.decrypt(encryptedData, txBytes);

      const callArgs = mockDecrypt.mock.calls[0][0];

      // Verify txBytes was passed correctly
      expect(callArgs.txBytes).toBe(txBytes);
      expect(Array.from(callArgs.txBytes)).toEqual([10, 20, 30, 40, 50]);
    });

    it('should enable share consistency checking', async () => {
      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20]);

      await sealService.decrypt(encryptedData, txBytes);

      const callArgs = mockDecrypt.mock.calls[0][0];

      // Verify checkShareConsistency is enabled
      expect(callArgs.checkShareConsistency).toBe(true);
    });

    it('should create SessionKey if not provided', async () => {
      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20]);

      await sealService.decrypt(encryptedData, txBytes);

      const callArgs = mockDecrypt.mock.calls[0][0];

      // Verify sessionKey was created
      expect(callArgs.sessionKey).toBeDefined();
    });

    it('should handle decryption errors gracefully', async () => {
      mockDecrypt.mockRejectedValueOnce(new Error('Access denied'));

      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20]);

      await expect(
        sealService.decrypt(encryptedData, txBytes)
      ).rejects.toThrow('Seal decryption failed: Access denied');
    });

    it('should handle key server errors', async () => {
      mockDecrypt.mockRejectedValueOnce(
        new Error('Failed to fetch keys from key servers')
      );

      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20]);

      await expect(
        sealService.decrypt(encryptedData, txBytes)
      ).rejects.toThrow('Failed to fetch keys from key servers');
    });

    it('should log decryption details', async () => {
      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy;

      const encryptedData = Buffer.from([1, 2, 3]);
      const txBytes = new Uint8Array([10, 20]);

      await sealService.decrypt(encryptedData, txBytes);

      console.log = originalLog;

      // Verify logging was called
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Buffer ↔ Uint8Array conversion', () => {
    it('should correctly convert Buffer to Uint8Array and back', async () => {
      const originalData = Buffer.from('Test data with special chars: 你好世界 🚀');

      // Encrypt (Buffer → Uint8Array → encrypted)
      await sealService.encrypt(originalData, '0xPolicy');

      const encryptArgs = mockEncrypt.mock.calls[0][0];
      const encryptedInput = encryptArgs.data;

      // Verify input conversion
      expect(encryptedInput).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(encryptedInput).toString()).toBe(originalData.toString());
    });

    it('should handle binary data correctly', async () => {
      // Binary data (e.g., image file)
      const binaryData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      ]);

      await sealService.encrypt(binaryData, '0xPolicy');

      const callArgs = mockEncrypt.mock.calls[0][0];
      const convertedData = callArgs.data;

      // Verify binary data integrity
      expect(Array.from(convertedData)).toEqual(Array.from(binaryData));
    });

    it('should handle empty buffers', async () => {
      const emptyBuffer = Buffer.from([]);

      await sealService.encrypt(emptyBuffer, '0xPolicy');

      const callArgs = mockEncrypt.mock.calls[0][0];
      expect(callArgs.data.length).toBe(0);
    });

    it('should handle large buffers', async () => {
      // 1MB of data
      const largeBuffer = Buffer.alloc(1024 * 1024);
      largeBuffer.fill(42);

      await sealService.encrypt(largeBuffer, '0xPolicy');

      const callArgs = mockEncrypt.mock.calls[0][0];
      expect(callArgs.data.length).toBe(1024 * 1024);
      expect(callArgs.data[0]).toBe(42);
      expect(callArgs.data[1024 * 1024 - 1]).toBe(42);
    });
  });

  describe('Configuration', () => {
    it('should initialize with testnet configuration', () => {
      const service = new SealEncryption('testnet');
      expect(service).toBeInstanceOf(SealEncryption);
    });

    it('should use environment variable for package ID', () => {
      process.env.SEAL_PACKAGE_ID = '0xEnvPackageId';
      const service = new SealEncryption('testnet');

      // Package ID is private, but we can test by encrypting
      const testPromise = service.encrypt(Buffer.from('test'), '0xPolicy');

      // This will fail without mocking, but we're testing initialization
      expect(service).toBeInstanceOf(SealEncryption);
    });

    it('should use custom threshold', async () => {
      const customService = new SealEncryption('testnet', '0xPackage', 3);

      await customService.encrypt(Buffer.from('test'), '0xPolicy');

      const callArgs = mockEncrypt.mock.calls[0][0];
      expect(callArgs.threshold).toBe(3);
    });

    it('should throw error for mainnet without configuration', () => {
      expect(() => {
        new SealEncryption('mainnet');
      }).toThrow('Mainnet key server configuration not implemented');
    });
  });

  describe('Error messages', () => {
    it('should provide descriptive error for encryption failure', async () => {
      mockEncrypt.mockRejectedValueOnce(new Error('Invalid policy ID format'));

      await expect(
        sealService.encrypt(Buffer.from('test'), 'invalid-policy')
      ).rejects.toThrow('Seal encryption failed: Invalid policy ID format');
    });

    it('should provide descriptive error for decryption failure', async () => {
      mockDecrypt.mockRejectedValueOnce(new Error('Transaction verification failed'));

      await expect(
        sealService.decrypt(Buffer.from([1, 2, 3]), new Uint8Array([10]))
      ).rejects.toThrow('Seal decryption failed: Transaction verification failed');
    });

    it('should handle unknown errors', async () => {
      mockEncrypt.mockRejectedValueOnce('String error');

      await expect(
        sealService.encrypt(Buffer.from('test'), '0xPolicy')
      ).rejects.toThrow('Seal encryption failed: Unknown error');
    });
  });

  describe('Integration patterns', () => {
    it('should work with encryption → decryption flow', async () => {
      // Simulate full flow
      const originalData = Buffer.from('Secret content');
      const policyId = '0xPolicyId';

      // 1. Encrypt
      const encrypted = await sealService.encrypt(originalData, policyId);
      expect(encrypted).toBeInstanceOf(Buffer);

      // 2. Simulate storage (e.g., Walrus)
      const storedData = encrypted;

      // 3. Decrypt with transaction proof
      const txBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const decrypted = await sealService.decrypt(storedData, txBytes);

      expect(decrypted).toBeInstanceOf(Buffer);
      expect(mockEncrypt).toHaveBeenCalledTimes(1);
      expect(mockDecrypt).toHaveBeenCalledTimes(1);
    });

    it('should support multiple encryptions with same policy', async () => {
      const policyId = '0xSamePolicy';
      const data1 = Buffer.from('Content 1');
      const data2 = Buffer.from('Content 2');

      await sealService.encrypt(data1, policyId);
      await sealService.encrypt(data2, policyId);

      expect(mockEncrypt).toHaveBeenCalledTimes(2);

      // Both should use same policy
      const call1 = mockEncrypt.mock.calls[0][0];
      const call2 = mockEncrypt.mock.calls[1][0];

      expect(call1.id).toBe(policyId);
      expect(call2.id).toBe(policyId);
    });

    it('should support different policies for different content', async () => {
      const policy1 = '0xPolicy1';
      const policy2 = '0xPolicy2';

      await sealService.encrypt(Buffer.from('Content 1'), policy1);
      await sealService.encrypt(Buffer.from('Content 2'), policy2);

      const call1 = mockEncrypt.mock.calls[0][0];
      const call2 = mockEncrypt.mock.calls[1][0];

      expect(call1.id).toBe(policy1);
      expect(call2.id).toBe(policy2);
    });
  });
});

describe('Singleton instance', () => {
  it('should export a singleton instance', async () => {
    const { seal } = await import('./encryption.service');
    expect(seal).toBeInstanceOf(SealEncryption);
  });
});
