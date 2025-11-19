import { SealClient, SessionKey } from '@mysten/seal';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SignatureWithBytes } from '@mysten/sui/cryptography';
import { WalrusClient } from '@mysten/walrus';
import dot from 'dotenv';

// Only load dotenv on server-side (Node.js environment)
if (typeof window === 'undefined') {
  dot.config();
}

export const CONFIG = {
  PACKAGE_ID:
    '0x40165ac9dd86da55bbd83465cfcae268a021f58e8cd5e54c7fcaad1161859f01',
  PUBLISHED_AT:
    '0x40165ac9dd86da55bbd83465cfcae268a021f58e8cd5e54c7fcaad1161859f01',
  PROFILE_REGISTRY:
    '0xeb507cc11d5a60e778fcf40ab888b2e94b51708854e3ec3aebffa54d339185bd',
  TIER_REGISTRY:
    '0xfc002c817679f33b0de430dda84149d5f9e1c7f1afc470069dcc4de18306e3e3',
  CONTENT_REGISTRY:
    '0x7f94954a4bb44c733e5550af143a04bf77d5b0b0a168de210271cb296f6c70e5',
  PROFILE_HANDLE:
    '0xcf51a413b4f6f106b19dd90df3155add7b3472eac046f162a643eac71794ebec',
};

// Server-only exports - only initialize on server-side
let keypair: Ed25519Keypair | undefined;
let suiClient: SuiClient | undefined;
let walrusClient: WalrusClient | undefined;
let sealClient: SealClient | undefined;
let sessionKey: SessionKey | undefined;

// Initialize server-only code only on server-side
if (typeof window === 'undefined') {
  keypair = Ed25519Keypair.fromSecretKey(
    process.env.PRIVATE_KEY as string
  );

  suiClient = new SuiClient({
    url: getFullnodeUrl('testnet'),
  });

  walrusClient = new WalrusClient({
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

  sealClient = new SealClient({
    suiClient,
    serverConfigs: sealObjectIds.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

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
export { keypair, suiClient, walrusClient, sealClient, sessionKey };

// Export getSessionKey function for creating session keys with user signing
export const getSessionKey = async (
  packageId: string,
  address: string,
  signPersonalMessage: (message: Uint8Array) => Promise<SignatureWithBytes>,
  ttlMin = 10
) => {
  if (!suiClient) {
    throw new Error('suiClient is not initialized. This function can only be called on the server side.');
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
