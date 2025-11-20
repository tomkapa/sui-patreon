import { SealClient, SessionKey } from '@mysten/seal';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { SignatureWithBytes } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex, toHex } from '@mysten/sui/utils';
import { WalrusClient } from '@mysten/walrus';
import dot from 'dotenv';

// Only load dotenv on server-side (Node.js environment)
if (typeof window === 'undefined') {
  dot.config();
}

export const CONFIG = {
  PACKAGE_ID:
    '0x1caafd43a5da2f0668b505533cc72208db7f94f5f9bb86f26a5ebb2476de3787',
  PUBLISHED_AT:
    '0x1caafd43a5da2f0668b505533cc72208db7f94f5f9bb86f26a5ebb2476de3787',
  PROFILE_REGISTRY:
    '0xee65eb125108c861547a574fdbe0463857426a30dbe38ed985cabaac76dbe881',
  TIER_REGISTRY:
    '0x02e7083f1b1c481fbf97b9d14b413a7f46707bef0a7d761b9faeea0bb42adb92',
  CONTENT_REGISTRY:
    '0x5e907d8cbd38f9f99b8704deb76c193a1bb432bad42f510c1416555b1bed8a86',
  PROFILE_HANDLE:
    '0xcf51a413b4f6f106b19dd90df3155add7b3472eac046f162a643eac71794ebec',
};

// Server-only exports - only initialize on server-side
let keypair: Ed25519Keypair | undefined;
const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'),
});

const walrusClient = new WalrusClient({
  network: 'testnet',
  suiClient,
  uploadRelay: {
    host: 'https://upload-relay.testnet.walrus.space',
    sendTip: {
      max: 1_000,
    },
  },
});

const sealObjectIds = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

const sealClient = new SealClient({
  suiClient,
  serverConfigs: sealObjectIds.map((id) => ({
    objectId: id,
    weight: 1,
  })),
  verifyKeyServers: false,
});
let sessionKey: SessionKey | undefined;

// Initialize server-only code only on server-side
if (typeof window === 'undefined') {
  keypair = Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY as string);

  // Initialize session key asynchronously
  (async () => {
    if (keypair && suiClient) {
      sessionKey = await SessionKey.create({
        address: keypair.toSuiAddress(),
        packageId: CONFIG.PACKAGE_ID,
        ttlMin: 10, // TTL of 10 minutes
        suiClient,
      });

      const message = sessionKey.getPersonalMessage();
      const { signature } = await keypair.signPersonalMessage(message); // User confirms in wallet
      sessionKey.setPersonalMessageSignature(signature); // Initialization complete
    }
  })();
}

// Export server-only values (will be undefined on client-side)
export { keypair, sealClient, sessionKey, suiClient, walrusClient };

// Export getSessionKey function for creating session keys with user signing
export const getSessionKey = async (
  packageId: string,
  address: string,
  signPersonalMessage: (message: Uint8Array) => Promise<SignatureWithBytes>,
  ttlMin = 10
) => {
  if (!suiClient) {
    throw new Error(
      'suiClient is not initialized. This function can only be called on the server side.'
    );
  }

  const sessionKey = await SessionKey.create({
    address,
    packageId,
    ttlMin,
    suiClient,
  });
  const message = sessionKey.getPersonalMessage();
  const { signature } = await signPersonalMessage(message); // User confirms in wallet
  sessionKey.setPersonalMessageSignature(signature); // Initialization complete
  return sessionKey;
};

export const computeID = (nonce: number, owner: string): string => {
  const nonceBytes = new Uint8Array(8);
  const view = new DataView(nonceBytes.buffer);
  view.setBigUint64(0, BigInt(nonce), true);

  const addressBytes = fromHex(owner);
  return toHex(new Uint8Array([...addressBytes, ...nonceBytes]));
};
