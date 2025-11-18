/**
 * Walrus Decentralized Storage Service
 *
 * Provides methods for uploading, downloading, and managing blobs on the Walrus network.
 * Walrus uses erasure coding for efficient, fault-tolerant decentralized storage.
 *
 * @see https://docs.wal.app for full documentation
 */

/**
 * Response type when a new blob is created
 */
interface WalrusNewlyCreatedResponse {
  newlyCreated: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
    encodedSize: number;
    cost: number;
  };
}

/**
 * Response type when a blob already exists
 */
interface WalrusAlreadyCertifiedResponse {
  alreadyCertified: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

/**
 * Union type for Walrus upload responses
 */
type WalrusUploadResponse = WalrusNewlyCreatedResponse | WalrusAlreadyCertifiedResponse;

/**
 * WalrusStorage class for interacting with Walrus decentralized storage
 *
 * Follows SOLID principles:
 * - Single Responsibility: Manages Walrus storage operations only
 * - Dependency Inversion: Depends on configuration, not hardcoded values
 * - Interface Segregation: Focused API with only necessary methods
 */
export class WalrusStorage {
  private readonly publisherUrl: string;
  private readonly aggregatorUrl: string;

  /**
   * Initialize Walrus storage client with configuration from environment
   *
   * @param publisherUrl - URL for Walrus publisher endpoint (uploads)
   * @param aggregatorUrl - URL for Walrus aggregator endpoint (downloads)
   */
  constructor(
    publisherUrl: string = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: string = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'
  ) {
    this.publisherUrl = publisherUrl;
    this.aggregatorUrl = aggregatorUrl;

    console.log('✅ Walrus Storage initialized', {
      publisher: this.publisherUrl,
      aggregator: this.aggregatorUrl,
    });
  }

  /**
   * Upload data to Walrus storage
   *
   * @param data - Buffer containing the data to upload
   * @param epochs - Number of epochs to store the data (default: 100, ~100 days on testnet)
   * @returns Promise resolving to the blob ID
   * @throws Error if upload fails
   *
   * @example
   * ```typescript
   * const blobId = await walrus.upload(Buffer.from('Hello World'), 100);
   * console.log(`Uploaded: ${blobId}`);
   * ```
   */
  async upload(data: Buffer, epochs: number = 100): Promise<string> {
    const sizeKB = (data.length / 1024).toFixed(2);
    console.log(`📤 Walrus upload started: ${sizeKB} KB for ${epochs} epochs`);

    try {
      const response = await fetch(`${this.publisherUrl}/v1/store?epochs=${epochs}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: data,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as WalrusUploadResponse;

      // Extract blob ID based on response type
      let blobId: string;
      if ('newlyCreated' in result) {
        blobId = result.newlyCreated.blobObject.blobId;
        console.log(`✅ Walrus upload successful (newly created): ${blobId}`, {
          size: result.newlyCreated.blobObject.size,
          cost: result.newlyCreated.cost,
          encodedSize: result.newlyCreated.encodedSize,
        });
      } else if ('alreadyCertified' in result) {
        blobId = result.alreadyCertified.blobId;
        console.log(`✅ Walrus upload successful (already certified): ${blobId}`, {
          endEpoch: result.alreadyCertified.endEpoch,
        });
      } else {
        throw new Error('Unexpected response format from Walrus');
      }

      return blobId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Walrus upload failed (${sizeKB} KB):`, message);
      throw new Error(`Walrus upload failed: ${message}`);
    }
  }

  /**
   * Download data from Walrus storage
   *
   * @param blobId - The blob ID to download
   * @returns Promise resolving to a Buffer containing the downloaded data
   * @throws Error if download fails
   *
   * @example
   * ```typescript
   * const data = await walrus.download('blobId123...');
   * console.log(`Downloaded ${data.length} bytes`);
   * ```
   */
  async download(blobId: string): Promise<Buffer> {
    console.log(`📥 Walrus download started: ${blobId}`);

    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/${blobId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const sizeKB = (buffer.length / 1024).toFixed(2);
      console.log(`✅ Walrus download successful: ${blobId} (${sizeKB} KB)`);

      return buffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Walrus download failed (${blobId}):`, message);
      throw new Error(`Walrus download failed: ${message}`);
    }
  }

  /**
   * Get the public URL for a blob
   *
   * @param blobId - The blob ID
   * @returns The public URL to access the blob
   *
   * @example
   * ```typescript
   * const url = walrus.getUrl('blobId123...');
   * // Returns: https://aggregator.walrus-testnet.walrus.space/v1/blobId123...
   * ```
   */
  getUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/${blobId}`;
  }

  /**
   * Check if a blob exists in Walrus storage
   *
   * @param blobId - The blob ID to check
   * @returns Promise resolving to true if blob exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await walrus.exists('blobId123...');
   * if (exists) {
   *   console.log('Blob is available');
   * }
   * ```
   */
  async exists(blobId: string): Promise<boolean> {
    try {
      const url = this.getUrl(blobId);
      const response = await fetch(url, { method: 'HEAD' });

      const exists = response.ok;
      console.log(`🔍 Walrus blob ${blobId}: ${exists ? 'exists' : 'not found'}`);

      return exists;
    } catch (error) {
      // Network errors or other issues mean we can't confirm existence
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Walrus exists check failed (${blobId}):`, message);
      return false;
    }
  }
}

/**
 * Singleton instance of WalrusStorage for application-wide use
 *
 * Import this instance to use Walrus storage throughout your application:
 * ```typescript
 * import { walrus } from './services/storage.service';
 *
 * const blobId = await walrus.upload(data);
 * ```
 */
export const walrus = new WalrusStorage();
