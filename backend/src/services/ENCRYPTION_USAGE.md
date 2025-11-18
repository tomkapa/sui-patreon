# Seal Encryption Service Usage Guide

## Overview

The Seal Encryption Service provides client-side encryption with on-chain access control policies. Content is encrypted before storage and can only be decrypted by users who prove they have access rights through Sui blockchain transactions.

## Architecture

```
┌─────────────┐
│   Creator   │
│             │
│ 1. Encrypt  │ ──────┐
│  Content    │       │ Encrypted Data
└─────────────┘       │
                      ↓
              ┌───────────────┐
              │    Walrus     │
              │   (Storage)   │
              └───────────────┘

┌─────────────┐       ┌──────────────┐
│   Fan       │       │ Sui Blockchain│
│             │       │               │
│ 2. Request  │ ───── │ 3. Verify     │
│    Access   │       │    Policy     │
└─────────────┘       └──────────────┘
      │                       │
      │ 4. If approved        │
      ↓                       ↓
┌─────────────────────────────────────┐
│      Seal Key Servers (t-of-n)      │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Server │  │ Server │  │ Server ││
│  │   1    │  │   2    │  │   3    ││
│  └────────┘  └────────┘  └────────┘│
│                                     │
│  5. Generate decryption key         │
└─────────────────────────────────────┘
      │
      │ 6. Decrypt client-side
      ↓
┌─────────────┐
│   Fan       │
│             │
│ 7. View     │
│    Content  │
└─────────────┘
```

## Basic Usage

### Import the Service

```typescript
import { seal } from './services/encryption.service';
```

### Encrypt Content

```typescript
// Content to encrypt
const content = Buffer.from('Premium content for tier 2 subscribers');

// Policy ID from on-chain access policy
const policyId = '0xPolicyObjectId123...';

// Encrypt
const encrypted = await seal.encrypt(content, policyId);

// Store encrypted content in Walrus
const blobId = await walrus.upload(encrypted);
```

### Decrypt Content (Requires Access Rights)

```typescript
// Download encrypted content from Walrus
const encrypted = await walrus.download(blobId);

// Build transaction to prove subscription/access
// This transaction calls a Move function that verifies access
const tx = new TransactionBlock();
tx.moveCall({
  target: `${PACKAGE_ID}::access_policy::seal_approve`,
  arguments: [
    tx.object(subscriptionNFT),
    tx.object(policyId),
  ],
});

// Get transaction bytes (proof of access)
const txBytes = await tx.build({ client: suiClient });

// Decrypt with proof
const decrypted = await seal.decrypt(encrypted, txBytes);
const content = decrypted.toString('utf-8');
```

## Complete Integration Example

### 1. Creator Uploads Protected Content

```typescript
import { seal } from './services/encryption.service';
import { walrus } from './services/storage.service';

async function uploadProtectedContent(
  file: File,
  tierIds: string[]
): Promise<{ blobId: string; policyId: string }> {
  // Read file content
  const arrayBuffer = await file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);

  // Create access policy on Sui
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PACKAGE_ID}::access_policy::create_policy`,
    arguments: [
      tx.pure(tierIds), // Tiers that can access
      tx.pure(Date.now() + 86400000), // Expiry: 24 hours
    ],
  });

  const result = await suiClient.signAndExecuteTransactionBlock({
    signer: creatorKeypair,
    transactionBlock: tx,
  });

  const policyId = extractObjectId(result);

  // Encrypt content
  const encrypted = await seal.encrypt(content, policyId);

  // Upload to Walrus
  const blobId = await walrus.upload(encrypted);

  // Store metadata in database
  await prisma.content.create({
    data: {
      blobId,
      policyId,
      creatorId,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    },
  });

  return { blobId, policyId };
}
```

### 2. Fan Accesses Content

```typescript
async function accessProtectedContent(
  contentId: string,
  subscriptionNFT: string
): Promise<Buffer> {
  // Get content metadata from database
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Download encrypted content from Walrus
  const encrypted = await walrus.download(content.blobId);

  // Build approval transaction
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PACKAGE_ID}::access_policy::seal_approve`,
    arguments: [
      tx.object(subscriptionNFT),
      tx.object(content.policyId),
    ],
  });

  // Build transaction bytes (don't execute yet)
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: false,
  });

  // Decrypt content
  // Seal will verify the transaction proves access rights
  const decrypted = await seal.decrypt(encrypted, txBytes);

  return decrypted;
}
```

### 3. Access Policy in Move

```move
module creator_platform::access_policy {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::clock::Clock;

    struct AccessPolicy has key {
        id: UID,
        creator: address,
        allowed_tiers: vector<ID>,
        expires_at: u64,
    }

    struct ActiveSubscription has key {
        id: UID,
        fan: address,
        tier_id: ID,
        expires_at: u64,
    }

    /// Called by Seal to verify access
    public fun seal_approve(
        subscription: &ActiveSubscription,
        policy: &AccessPolicy,
        clock: &Clock,
        ctx: &TxContext
    ): bool {
        let current_time = clock::timestamp_ms(clock);

        // Verify subscription is active
        if (subscription.expires_at < current_time) {
            return false
        };

        // Verify subscription tier is allowed
        let tier_allowed = vector::contains(
            &policy.allowed_tiers,
            &subscription.tier_id
        );

        if (!tier_allowed) {
            return false
        };

        // Verify policy hasn't expired
        if (policy.expires_at < current_time) {
            return false
        };

        true
    }
}
```

## Configuration

### Environment Variables

```env
# Required: Package ID for policy namespace
SEAL_PACKAGE_ID=0xYourPackageId...

# Optional: Custom key server configurations
SEAL_KEY_SERVERS=[
  {"objectId":"0xKeyServer1...","weight":1},
  {"objectId":"0xKeyServer2...","weight":1},
  {"objectId":"0xKeyServer3...","weight":1}
]
```

### Custom Configuration

```typescript
import { SealEncryption } from './services/encryption.service';

// Custom instance with specific configuration
const customSeal = new SealEncryption(
  'testnet',           // network
  '0xCustomPackage',   // package ID
  3                    // threshold (3-of-n key servers)
);
```

## API Reference

### `encrypt(data: Buffer, policyId: string, packageId?: string): Promise<Buffer>`

Encrypts data with policy-based access control.

**Parameters:**
- `data`: Buffer containing data to encrypt
- `policyId`: On-chain policy ID that controls access
- `packageId`: Optional package ID (uses default if not provided)

**Returns:** Promise resolving to encrypted data as Buffer

**Throws:** Error if encryption fails or package ID is not set

**Example:**
```typescript
const encrypted = await seal.encrypt(
  Buffer.from('secret'),
  '0xPolicyId'
);
```

### `decrypt(encryptedData: Buffer, txBytes: Uint8Array, sessionKey?: SessionKey): Promise<Buffer>`

Decrypts data using transaction proof of access rights.

**Parameters:**
- `encryptedData`: Buffer containing encrypted data
- `txBytes`: Transaction bytes proving access rights
- `sessionKey`: Optional session key (auto-created if not provided)

**Returns:** Promise resolving to decrypted data as Buffer

**Throws:** Error if decryption fails or access is denied

**Example:**
```typescript
const decrypted = await seal.decrypt(
  encrypted,
  txBytes
);
```

## Security Considerations

### 1. Transaction Verification

- The transaction bytes (`txBytes`) are verified by Seal key servers
- Must call a `seal_approve*` function in your Move contract
- Transaction doesn't need to be executed on-chain for decryption
- Key servers verify the transaction would succeed if executed

### 2. Policy Security

- Policies are immutable once created (unless designed otherwise)
- Ensure policy logic is thoroughly tested
- Consider time-based expiration for temporary access
- Use tier-based access for subscription models

### 3. Key Management

- Seal uses threshold encryption (t-of-n)
- No single key server can decrypt alone
- Default threshold is 2 (requires 2 key servers)
- Symmetric encryption key is returned but should be stored securely

### 4. Data Security

- Data is encrypted client-side before leaving the environment
- Encrypted data can be stored on public storage (Walrus)
- Only users with valid access proof can decrypt
- Encryption is tied to policy, not storage location

## Performance Considerations

### Encryption

- **Time Complexity**: O(n) where n is data size
- **Overhead**: ~5-10ms for small files (<1MB)
- **Large Files**: Consider chunking for files >100MB

### Decryption

- **Network Calls**: Requires communication with key servers
- **Time**: 3-5 seconds per decryption (includes key fetching)
- **Caching**: Seal SDK caches keys for the session
- **Optimization**: Use `fetchKeys` to batch fetch keys

### Recommended Patterns

```typescript
// ❌ Bad: Decrypt multiple files sequentially
for (const content of contents) {
  const decrypted = await seal.decrypt(content.encrypted, txBytes);
}

// ✅ Good: Batch fetch keys first
const ids = contents.map(c => c.policyId);
await seal.fetchKeys({ ids, txBytes, sessionKey, threshold: 2 });

// Then decrypt (uses cached keys)
for (const content of contents) {
  const decrypted = await seal.decrypt(content.encrypted, txBytes);
}
```

## Error Handling

### Common Errors

1. **"Package ID is required"**
   - Solution: Set `SEAL_PACKAGE_ID` environment variable

2. **"Seal encryption failed: ..."**
   - Check network connectivity to Sui
   - Verify package ID is correct
   - Ensure policy ID is valid

3. **"Seal decryption failed: Access denied"**
   - User doesn't have access rights
   - Subscription expired
   - Transaction doesn't prove access
   - Policy expired

4. **"Failed to fetch keys from key servers"**
   - Network issue with key servers
   - Transaction verification failed
   - Threshold not met

### Error Recovery

```typescript
async function safeDecrypt(
  encrypted: Buffer,
  txBytes: Uint8Array
): Promise<Buffer | null> {
  try {
    return await seal.decrypt(encrypted, txBytes);
  } catch (error) {
    if (error.message.includes('Access denied')) {
      console.log('User does not have access');
      return null;
    }

    if (error.message.includes('key servers')) {
      console.log('Key server issue, retrying...');
      // Retry logic
    }

    throw error; // Re-throw other errors
  }
}
```

## Testing

### Unit Tests

All tests mock the Seal SDK to avoid network calls:

```bash
bun test src/services/encryption.service.test.ts
```

### Integration Testing

For integration tests with real Seal servers:

1. Set up testnet account with SUI tokens
2. Deploy access policy contracts
3. Configure key server endpoints
4. Test full encrypt → store → decrypt flow

## Resources

- [Seal Documentation](https://seal-docs.wal.app/)
- [Seal SDK on npm](https://www.npmjs.com/package/@mysten/seal)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [Walrus Storage Docs](https://docs.wal.app)

## Support

For issues or questions:
- GitHub: https://github.com/MystenLabs/seal
- Discord: Sui Discord #seal channel
- Docs: https://seal-docs.wal.app/
