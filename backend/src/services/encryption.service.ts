/**
 * Seal Encryption Service
 *
 * Provides client-side encryption with on-chain access control policies using
 * Mysten Labs Seal SDK. This service enables identity-based encryption where
 * decryption requires proof of access rights via Sui blockchain transactions.
 *
 * @see https://seal-docs.wal.app/ for full documentation
 */

import { SealClient, SessionKey } from '@mysten/seal';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import type { SealClientOptions, EncryptOptions, DecryptOptions } from '@mysten/seal';

/**
 * Configuration for Seal key servers
 * These servers provide threshold-based decryption keys
 */
interface KeyServerConfig {
  objectId: string;
  weight: number;
  apiKeyName?: string;
  apiKey?: string;
}

/**
 * SealEncryption class for encrypting and decrypting content with policy-based access control
 *
 * Follows SOLID principles:
 * - Single Responsibility: Manages Seal encryption/decryption operations only
 * - Dependency Inversion: Depends on SealClient abstraction, not implementation details
 * - Interface Segregation: Focused API with only necessary encryption methods
 *
 * Architecture:
 * 1. Client-side encryption before data leaves the environment
 * 2. On-chain policies (Move smart contracts) define access rules
 * 3. Threshold encryption (t-of-n) across multiple key servers
 * 4. Decryption requires valid transaction proving access rights
 */
export class SealEncryption {
  private readonly seal: SealClient;
  private readonly suiClient: SuiClient;
  private readonly defaultPackageId: string;
  private readonly defaultThreshold: number;

  /**
   * Initialize Seal encryption client with Sui network and key server configuration
   *
   * @param network - Sui network to use ('testnet' or 'mainnet')
   * @param packageId - Default package ID for policy namespace (optional)
   * @param threshold - Default threshold for key servers (optional, default: 2)
   */
  constructor(
    network: 'testnet' | 'mainnet' = 'testnet',
    packageId?: string,
    threshold: number = 2
  ) {
    // Initialize Sui client
    this.suiClient = new SuiClient({
      url: getFullnodeUrl(network)
    });

    // Get key server configurations from environment or use defaults
    const serverConfigs = this.getKeyServerConfigs(network);

    // Initialize Seal client with key servers
    const sealOptions: SealClientOptions = {
      suiClient: this.suiClient as any, // Type assertion for compatibility
      serverConfigs,
      verifyKeyServers: true,
      timeout: 30000, // 30 second timeout
    };

    this.seal = new SealClient(sealOptions);
    this.defaultPackageId = packageId || process.env.SEAL_PACKAGE_ID || '';
    this.defaultThreshold = threshold;

    console.log('✅ Seal Encryption initialized', {
      network,
      keyServers: serverConfigs.length,
      threshold: this.defaultThreshold,
      packageId: this.defaultPackageId || '(not set)',
    });
  }

  /**
   * Get key server configurations for the specified network
   *
   * Key servers provide decryption keys after verifying on-chain access policies.
   * Uses t-of-n threshold encryption for fault tolerance and security.
   *
   * @param network - Network to get key server configs for
   * @returns Array of key server configurations
   * @private
   */
  private getKeyServerConfigs(network: 'testnet' | 'mainnet'): KeyServerConfig[] {
    // Try to get custom configs from environment
    const customConfigs = process.env.SEAL_KEY_SERVERS;
    if (customConfigs) {
      try {
        return JSON.parse(customConfigs);
      } catch (error) {
        console.warn('⚠️  Invalid SEAL_KEY_SERVERS config, using defaults');
      }
    }

    // Default key server configurations for testnet
    // These are public testnet servers operated by Mysten Labs
    if (network === 'testnet') {
      return [
        {
          objectId: '0x1', // Placeholder - replace with actual key server object IDs
          weight: 1,
        },
        {
          objectId: '0x2', // Placeholder - replace with actual key server object IDs
          weight: 1,
        },
        {
          objectId: '0x3', // Placeholder - replace with actual key server object IDs
          weight: 1,
        },
      ];
    }

    // Mainnet configurations would go here
    throw new Error('Mainnet key server configuration not implemented');
  }

  /**
   * Encrypt data with policy-based access control
   *
   * The encrypted data can only be decrypted by users who can prove they have
   * access rights through a valid Sui transaction that satisfies the policy.
   *
   * @param data - Buffer containing the data to encrypt
   * @param policyId - On-chain policy ID (identity) that controls access
   * @param packageId - Package ID namespace for the policy (optional, uses default if not provided)
   * @returns Promise resolving to encrypted data as Buffer
   * @throws Error if encryption fails
   *
   * @example
   * ```typescript
   * const encrypted = await seal.encrypt(
   *   Buffer.from('secret content'),
   *   '0xPolicyObjectId123...'
   * );
   * // Store encrypted data in Walrus
   * await walrus.upload(encrypted);
   * ```
   */
  async encrypt(
    data: Buffer,
    policyId: string,
    packageId?: string
  ): Promise<Buffer> {
    const sizeKB = (data.length / 1024).toFixed(2);
    console.log(`🔒 Seal encryption started: ${sizeKB} KB with policy ${policyId}`);

    try {
      // Convert Buffer to Uint8Array (required by Seal SDK)
      const dataArray = new Uint8Array(data);

      // Prepare encryption options
      const encryptOptions: EncryptOptions = {
        threshold: this.defaultThreshold,
        packageId: packageId || this.defaultPackageId,
        id: policyId, // Policy ID acts as the identity for IBE
        data: dataArray,
      };

      // Validate required parameters
      if (!encryptOptions.packageId) {
        throw new Error('Package ID is required for encryption. Set SEAL_PACKAGE_ID or provide packageId parameter.');
      }

      // Encrypt data using Seal SDK
      const { encryptedObject, key } = await this.seal.encrypt(encryptOptions);

      // Convert encrypted Uint8Array back to Buffer
      const encryptedBuffer = Buffer.from(encryptedObject);

      console.log(`✅ Seal encryption successful: ${sizeKB} KB`, {
        policyId,
        encryptedSize: encryptedBuffer.length,
        symmetricKeySize: key.length,
      });

      // Note: The symmetric key can be stored for backup/recovery
      // but should be kept secure as it can decrypt the data directly

      return encryptedBuffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Seal encryption failed (${sizeKB} KB):`, message);
      throw new Error(`Seal encryption failed: ${message}`);
    }
  }

  /**
   * Decrypt data using transaction proof of access rights
   *
   * Decryption requires a valid Sui transaction that proves the caller has
   * access rights according to the on-chain policy. The transaction must call
   * a seal_approve* function that validates the access policy.
   *
   * @param encryptedData - Buffer containing encrypted data
   * @param txBytes - Transaction bytes that prove access rights
   * @param sessionKey - Session key for this decryption session (optional)
   * @returns Promise resolving to decrypted data as Buffer
   * @throws Error if decryption fails or access is denied
   *
   * @example
   * ```typescript
   * // Download encrypted data from Walrus
   * const encrypted = await walrus.download(blobId);
   *
   * // Build transaction to prove subscription/access
   * const tx = new TransactionBlock();
   * tx.moveCall({
   *   target: `${PACKAGE_ID}::access_policy::seal_approve`,
   *   arguments: [tx.object(subscriptionNFT), tx.object(policyId)],
   * });
   *
   * // Get transaction bytes
   * const txBytes = await tx.build({ client: suiClient });
   *
   * // Decrypt with proof
   * const decrypted = await seal.decrypt(encrypted, txBytes);
   * ```
   */
  async decrypt(
    encryptedData: Buffer,
    txBytes: Uint8Array,
    sessionKey?: SessionKey
  ): Promise<Buffer> {
    const sizeKB = (encryptedData.length / 1024).toFixed(2);
    console.log(`🔓 Seal decryption started: ${sizeKB} KB`);

    try {
      // Convert Buffer to Uint8Array (required by Seal SDK)
      const encryptedArray = new Uint8Array(encryptedData);

      // Create or use provided session key
      const activeSessionKey = sessionKey || new SessionKey();

      // Prepare decryption options
      const decryptOptions: DecryptOptions = {
        data: encryptedArray,
        sessionKey: activeSessionKey,
        txBytes: txBytes,
        checkShareConsistency: true, // Verify all key servers return consistent shares
      };

      // Decrypt data using Seal SDK
      // This will:
      // 1. Verify the transaction proves access according to policy
      // 2. Fetch decryption key shares from t-of-n key servers
      // 3. Combine shares to reconstruct decryption key
      // 4. Decrypt the data
      const decryptedArray = await this.seal.decrypt(decryptOptions);

      // Convert decrypted Uint8Array back to Buffer
      const decryptedBuffer = Buffer.from(decryptedArray);

      const decryptedSizeKB = (decryptedBuffer.length / 1024).toFixed(2);
      console.log(`✅ Seal decryption successful: ${decryptedSizeKB} KB`);

      return decryptedBuffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Seal decryption failed (${sizeKB} KB):`, message);
      throw new Error(`Seal decryption failed: ${message}`);
    }
  }

  /**
   * Helper: Build transaction bytes for testing
   * In production, this would be done client-side
   *
   * @param policyId - Policy object ID to approve
   * @param subscriptionId - Subscription NFT object ID
   * @returns Transaction bytes
   * @private
   */
  async buildApprovalTransaction(
    policyId: string,
    subscriptionId: string
  ): Promise<Uint8Array> {
    // This is a placeholder - actual implementation would depend on
    // the Move smart contract's seal_approve function signature
    throw new Error('buildApprovalTransaction must be implemented based on Move contract');
  }
}

/**
 * Singleton instance of SealEncryption for application-wide use
 *
 * Import this instance to use Seal encryption throughout your application:
 * ```typescript
 * import { seal } from './services/encryption.service';
 *
 * const encrypted = await seal.encrypt(data, policyId);
 * const decrypted = await seal.decrypt(encrypted, txBytes);
 * ```
 */
export const seal = new SealEncryption('testnet');
