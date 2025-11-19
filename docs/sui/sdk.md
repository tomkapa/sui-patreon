# Sui TypeScript SDK Guide

## Installation

```bash
npm install @mysten/sui @mysten/walrus @mysten/seal
```

## Core Principles

### 1. Client Initialization Pattern
```typescript
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { WalrusClient } from '@mysten/walrus';
import { SealClient, SessionKey } from '@mysten/seal';

// Network: 'testnet' | 'mainnet' | 'devnet' | 'localnet'
const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

// Keypair from private key (Bech32 or hex)
const keypair = Ed25519Keypair.fromSecretKey('suiprivkey1...');

// Walrus for storage
const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient,
});

// Seal for encryption/access control
const sealObjectIds = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

const sealClient = new SealClient({
  suiClient,
  serverConfigs: sealObjectIds.map((id) => ({ objectId: id, weight: 1 })),
  verifyKeyServers: false,
});
```

### 2. Transaction Building Pattern
```typescript
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

const tx = new Transaction();

// Move call structure
tx.moveCall({
  target: `${PACKAGE_ID}::module::function`,
  arguments: [
    tx.object(registryId),           // Object reference
    tx.pure.string('value'),         // String primitive
    tx.pure.u64(12345),              // Number primitive
    tx.pure.id(objectId),            // ID type
    tx.pure.address(walletAddress),  // Address type
    tx.pure.vector('id', [id1, id2]), // Vector of IDs
    tx.object(SUI_CLOCK_OBJECT_ID),  // Clock for timestamps
  ],
});
```

### 3. Type Mapping (Move ↔ TypeScript)
```typescript
// Move Type          → TypeScript Method
// ------------------------------------
// String             → tx.pure.string(value)
// u8/u64/u128        → tx.pure.u8/u64/u128(value)
// address            → tx.pure.address(value)
// ID                 → tx.pure.id(value)
// vector<ID>         → tx.pure.vector('id', array)
// vector<u8>         → tx.pure.vector('u8', array)
// Object<T>          → tx.object(objectId)
// &Clock             → tx.object(SUI_CLOCK_OBJECT_ID)
```

## Transaction Execution Patterns

### Backend (Node.js) - Direct Signing
```typescript
const result = await suiClient.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair,
  options: {
    showObjectChanges: true,
    showEffects: true,
    showEvents: true,
  },
});

console.log('Digest:', result.digest);
console.log('Events:', result.events);
console.log('Created:', result.objectChanges?.filter(c => c.type === 'created'));
```

### Frontend (React) - zkLogin with Hook
```typescript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

const { digest } = await signAndExecuteTransaction({
  transaction: tx,
});
```

### Frontend (React) - Walrus Multi-Step Flow
```typescript
// Step 1: Encode (instant)
const flow = walrusClient.writeFilesFlow({ files });
await flow.encode();

// Step 2: Register (requires user signature)
const registerTx = flow.register({
  epochs: 3,
  owner: userAddress,
  deletable: true,
});
const { digest: registerDigest } = await signAndExecuteTransaction({
  transaction: registerTx,
});

// Step 3: Upload to storage nodes
await flow.upload({ digest: registerDigest });

// Step 4: Certify (requires user signature)
const certifyTx = flow.certify();
await signAndExecuteTransaction({ transaction: certifyTx });

// Get uploaded files
const files = await flow.listFiles();
```

## Real Contract Examples

### Create Profile
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::profile::create_profile`,
  arguments: [
    tx.object(PROFILE_REGISTRY),
    tx.pure.string('alice.sui'),           // name
    tx.pure.string('Digital creator'),     // bio
    tx.pure.string('https://...jpg'),      // avatarUrl
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
});

const result = await suiClient.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair,
});
```

### Create Subscription Tier
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::subscription::create_tier`,
  arguments: [
    tx.object(TIER_REGISTRY),
    tx.pure.string('Premium'),
    tx.pure.string('Access to all content'),
    tx.pure.u64(10_000_000),  // 10 USDC (6 decimals)
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
});
```

### Purchase Subscription
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::subscription::purchase_subscription`,
  arguments: [
    tx.object(TIER_REGISTRY),
    tx.pure.address(creatorAddress),
    tx.pure.id(tierId),
    tx.object(paymentCoinId),  // USDC coin object
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
});
```

### Create Content
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::content::create_content`,
  arguments: [
    tx.object(CONTENT_REGISTRY),
    tx.pure.u64(1),                           // nonce
    tx.pure.string('Video Title'),
    tx.pure.string('Description'),
    tx.pure.string('video/mp4'),              // contentType
    tx.pure.string(previewPatchId),           // preview
    tx.pure.string(sealedPatchId),            // sealed (encrypted)
    tx.pure.vector('id', [tierId1, tierId2]), // access control
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
});
```

## Walrus Integration Patterns

### Upload with Encryption
```typescript
import { WalrusFile } from '@mysten/walrus';

// 1. Encrypt content with Seal
const { encryptedObject } = await sealClient.encrypt({
  threshold: 2,
  packageId: PACKAGE_ID,
  id: computeContentId(nonce),
  data: contentBytes,
});

// 2. Create WalrusFile
const file = WalrusFile.from({
  contents: encryptedObject,
  identifier: 'content.enc',
  tags: { 'content-type': 'application/encrypted' },
});

// 3. Upload flow
const flow = walrusClient.writeFilesFlow({ files: [file] });
await flow.encode();

const registerTx = flow.register({
  epochs: 3,
  owner: address,
  deletable: true,
});

const { digest } = await suiClient.signAndExecuteTransaction({
  transaction: registerTx,
  signer: keypair,
});

await flow.upload({ digest });

const certifyTx = flow.certify();
await suiClient.signAndExecuteTransaction({
  transaction: certifyTx,
  signer: keypair,
});
```

### Download and Decrypt
```typescript
import { EncryptedObject } from '@mysten/seal';
import { fromHex } from '@mysten/sui/utils';

// 1. Get content metadata from Sui
const content = await suiClient.getObject({
  id: contentId,
  options: { showContent: true },
});

const patchId = (content.data?.content as any).fields.sealed_patch_id;

// 2. Download from Walrus
const [patch] = await walrusClient.getFiles({ ids: [patchId] });
const encryptedBytes = await patch.bytes();

// 3. Build approval transaction
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::content::seal_approve`,
  arguments: [
    tx.pure.vector('u8', fromHex(EncryptedObject.parse(encryptedBytes).id)),
    tx.object(contentId),
    tx.object(subscriptionId),
    tx.object(SUI_CLOCK_OBJECT_ID),
  ],
});

const txBytes = await tx.build({
  client: suiClient,
  onlyTransactionKind: true,
});

// 4. Decrypt with Seal
const decryptedBytes = await sealClient.decrypt({
  data: encryptedBytes,
  sessionKey,
  txBytes,
});

const result = new TextDecoder('utf-8').decode(new Uint8Array(decryptedBytes));
```

## Seal Session Management

```typescript
import { SessionKey } from '@mysten/seal';

// Create session key
const sessionKey = await SessionKey.create({
  address: keypair.toSuiAddress(),
  packageId: PACKAGE_ID,
  ttlMin: 10,  // 10 minute lifetime
  suiClient,
});

// Sign personal message (user confirms in wallet)
const message = sessionKey.getPersonalMessage();
const { signature } = await keypair.signPersonalMessage(message);
sessionKey.setPersonalMessageSignature(signature);

// Now ready for decrypt operations
```

## Query Patterns

### Get Owned Objects by Type
```typescript
const objects = await suiClient.getOwnedObjects({
  owner: address,
  filter: {
    StructType: `${PACKAGE_ID}::profile::CreatorProfile`,
  },
  options: {
    showContent: true,
    showType: true,
  },
});
```

### Get Object Details
```typescript
const object = await suiClient.getObject({
  id: objectId,
  options: {
    showContent: true,
    showOwner: true,
    showType: true,
  },
});

const fields = (object.data?.content as any)?.fields;
```

### Subscribe to Events
```typescript
const unsubscribe = await suiClient.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::profile::ProfileCreated`,
  },
  onMessage: (event) => {
    console.log('New profile:', event.parsedJson);
  },
});
```

## Error Handling

```typescript
try {
  const result = await suiClient.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });
} catch (error: any) {
  if (error.message?.includes('InsufficientBalance')) {
    console.error('Not enough SUI for gas');
  } else if (error.message?.includes('ObjectNotFound')) {
    console.error('Object does not exist');
  } else {
    console.error('Transaction failed:', error.message);
  }
}
```

## Environment Configuration

```bash
# .env
PRIVATE_KEY=suiprivkey1...
PACKAGE_ID=0x...
PROFILE_REGISTRY=0x...
TIER_REGISTRY=0x...
CONTENT_REGISTRY=0x...
SUI_NETWORK=testnet
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
  PACKAGE_ID: process.env.PACKAGE_ID!,
  PROFILE_REGISTRY: process.env.PROFILE_REGISTRY!,
  TIER_REGISTRY: process.env.TIER_REGISTRY!,
  CONTENT_REGISTRY: process.env.CONTENT_REGISTRY!,
  NETWORK: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet',
};
```

## Utility Helpers

### Extract Created Objects
```typescript
function extractCreatedObjects(result: any) {
  if (!result.objectChanges) return [];

  return result.objectChanges
    .filter((c: any) => c.type === 'created')
    .map((c: any) => ({
      type: c.objectType.split('::').pop(),
      id: c.objectId,
    }));
}
```

### Parse Events
```typescript
function parseEvents(result: any) {
  if (!result.events) return [];

  return result.events.map((event: any) => ({
    type: event.type.split('::').pop(),
    data: event.parsedJson,
  }));
}
```

### Compute Content ID for Seal
```typescript
import { fromHex, toHex } from '@mysten/sui/utils';

function computeContentId(nonce: number, address: string): string {
  const nonceBytes = new Uint8Array(8);
  new DataView(nonceBytes.buffer).setBigUint64(0, BigInt(nonce), true);

  const addressBytes = fromHex(address);
  return toHex(new Uint8Array([...addressBytes, ...nonceBytes]));
}
```

## React Integration Patterns

### Centralized Transaction Handler

Create a reusable hook for all transactions with automatic toast notifications:

```typescript
// lib/sui/transactions.ts
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { useState } from 'react';

export interface TransactionOptions {
  successMessage?: string;
  errorMessage?: string;
}

export function useTransaction() {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [isLoading, setIsLoading] = useState(false);

  const execute = async (
    buildTx: (tx: Transaction) => void | Promise<void>,
    options: TransactionOptions = {}
  ) => {
    setIsLoading(true);

    try {
      // Build transaction
      const tx = new Transaction();
      await buildTx(tx);

      // Execute transaction
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      // Show info toast with transaction hash
      toast.info('Transaction sent', {
        description: (
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
            target="_blank"
            className="underline"
          >
            View on Explorer
          </a>
        ),
        duration: 3000,
      });

      // Wait for transaction to complete
      await client.waitForTransaction({
        digest: result.digest,
      });

      // Show success toast
      toast.success(options.successMessage || 'Transaction successful!', {
        duration: 5000,
      });

      return result;
    } catch (error: any) {
      // Show error toast
      toast.error(options.errorMessage || 'Transaction failed', {
        description: error.message || 'Unknown error occurred',
        duration: 7000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading };
}
```

### Usage in Components

```typescript
import { useTransaction } from '@/lib/sui/transactions';
import { PACKAGE_ID, TIER_REGISTRY } from '@/lib/sui/constants';

function SubscribeButton({ tierId, price }: Props) {
  const { execute, isLoading } = useTransaction();

  const handleSubscribe = async () => {
    await execute(
      async (tx) => {
        // Your transaction building logic
        tx.moveCall({
          target: `${PACKAGE_ID}::subscription::purchase_subscription`,
          arguments: [
            tx.object(TIER_REGISTRY),
            tx.pure.id(tierId),
            // ...
          ],
        });
      },
      {
        successMessage: 'Successfully subscribed!',
        errorMessage: 'Failed to purchase subscription',
      }
    );
  };

  return (
    <Button onClick={handleSubscribe} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Subscribe'}
    </Button>
  );
}
```

### Coin Selection and Merging

Handle USDC coin selection automatically:

```typescript
// lib/sui/coins.ts
export async function selectPaymentCoin(
  tx: Transaction,
  client: SuiClient,
  owner: string,
  amount: bigint
): Promise<string> {
  const coins = await client.getCoins({
    owner,
    coinType: USDC_TYPE,
  });

  if (coins.data.length === 0) {
    throw new Error('No USDC coins found in wallet');
  }

  const totalBalance = coins.data.reduce(
    (sum, coin) => sum + BigInt(coin.balance),
    0n
  );

  if (totalBalance < amount) {
    throw new Error(`Insufficient USDC balance`);
  }

  // Find single coin with sufficient balance
  const sufficientCoin = coins.data.find(
    (coin) => BigInt(coin.balance) >= amount
  );

  if (sufficientCoin) {
    return sufficientCoin.coinObjectId;
  }

  // Merge coins if needed
  const sortedCoins = [...coins.data].sort((a, b) =>
    BigInt(b.balance) > BigInt(a.balance) ? 1 : -1
  );

  const primaryCoin = sortedCoins[0];
  const coinsToMerge = sortedCoins.slice(1).map((c) => c.coinObjectId);

  tx.mergeCoins(
    tx.object(primaryCoin.coinObjectId),
    coinsToMerge.map((id) => tx.object(id))
  );

  return primaryCoin.coinObjectId;
}
```

### Complete Subscription Example

```typescript
// lib/sui/subscription.ts
import { useCallback } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useTransaction } from './transactions';
import { selectPaymentCoin } from './coins';
import { PACKAGE_ID, TIER_REGISTRY, SUI_CLOCK_OBJECT_ID } from './constants';

export function usePurchaseSubscription() {
  const { execute, isLoading } = useTransaction();
  const client = useSuiClient();

  const purchaseSubscription = useCallback(
    async (params: {
      creatorAddress: string;
      tierId: string;
      priceUsdc: number;
      tierName: string;
    }, userAddress: string) => {
      return execute(
        async (tx: Transaction) => {
          // Convert to smallest unit (6 decimals for USDC)
          const amount = BigInt(params.priceUsdc * 1_000_000);

          // Select payment coin (merges if needed)
          const paymentCoinId = await selectPaymentCoin(
            tx,
            client,
            userAddress,
            amount
          );

          // Call contract
          tx.moveCall({
            target: `${PACKAGE_ID}::subscription::purchase_subscription`,
            arguments: [
              tx.object(TIER_REGISTRY),
              tx.pure.address(params.creatorAddress),
              tx.pure.id(params.tierId),
              tx.object(paymentCoinId), // Don't split - Move does it internally
              tx.object(SUI_CLOCK_OBJECT_ID),
            ],
          });
        },
        {
          successMessage: `Successfully subscribed to ${params.tierName}!`,
          errorMessage: 'Failed to purchase subscription',
        }
      );
    },
    [execute, client]
  );

  return { purchaseSubscription, isLoading };
}
```

## Best Practices

1. **Always use `SUI_CLOCK_OBJECT_ID`** for Move functions requiring `&Clock`
2. **Type safety**: Use `tx.pure.<type>()` methods, not raw `tx.pure()`
3. **Gas management**: Set sender with `tx.setSender(address)` before building
4. **Object changes**: Request `showObjectChanges: true` to track created objects
5. **Events**: Request `showEvents: true` for emitted events
6. **Keypair security**: Never commit private keys, use environment variables
7. **Testnet first**: Always test on testnet before mainnet deployment
8. **Walrus flows**: Use `writeFilesFlow()` for browser (wallet popup friendly)
9. **Seal sessions**: Cache session keys (10min TTL), recreate when expired
10. **Error handling**: Wrap all blockchain calls in try-catch blocks
11. **Toast notifications**: Show transaction hash immediately, result after confirmation
12. **Coin merging**: Automatically merge USDC coins when needed for payments
13. **Centralize transactions**: Use a single hook for all transaction logic
14. **Wait for confirmation**: Always wait for transaction before showing success

## Common Pitfalls

### Type Safety Issues

❌ **Wrong**: `tx.pure(value)` - no type information
✅ **Correct**: `tx.pure.string(value)` - explicit type

❌ **Wrong**: Using raw bytes for object IDs
✅ **Correct**: `tx.pure.id(objectId)` or `tx.object(objectId)`

### Coin Handling Issues

❌ **Wrong**: Manually splitting coins when Move function takes `&mut Coin<T>`
```typescript
// DON'T DO THIS - creates unused value error
const [paymentCoin] = tx.splitCoins(tx.object(coinId), [tx.pure.u64(amount)]);
tx.moveCall({
  arguments: [paymentCoin, ...], // ❌ UnusedValueWithoutDrop error
});
```

✅ **Correct**: Pass the whole coin object when function signature is `&mut Coin<T>`
```typescript
// Move function splits internally
tx.moveCall({
  arguments: [tx.object(coinId), ...], // ✅ Correct
});
```

**Rule of Thumb:**
- `Coin<T>` (owned value) → Split manually with `tx.splitCoins()`
- `&mut Coin<T>` (mutable reference) → Pass whole coin with `tx.object()`
- `&Coin<T>` (immutable reference) → Pass whole coin with `tx.object()`

### ID vs Object ID Confusion

❌ **Wrong**: Using database UUIDs for blockchain calls
```typescript
const tier = { id: "04251dd5-...", tierId: "0x123abc..." };
tx.pure.id(tier.id); // ❌ Invalid Sui address error
```

✅ **Correct**: Use blockchain object IDs
```typescript
tx.pure.id(tier.tierId); // ✅ Correct blockchain ID
```

**Best Practice**: Maintain both IDs in your data model:
- `id`: Database UUID (internal use)
- `objectId` or `tierId`: Sui blockchain object ID (for transactions)

### Other Common Mistakes

❌ **Wrong**: Hardcoding gas budget
✅ **Correct**: Let SDK estimate gas automatically

❌ **Wrong**: Single Walrus call with all operations
✅ **Correct**: Separate register/upload/certify for browser UX

❌ **Wrong**: Storing private keys in code
✅ **Correct**: Use environment variables + wallet integration
