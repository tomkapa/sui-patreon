import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';

export function loadKeypairFromPrivateKey(privateKey: string): Ed25519Keypair {
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Convert hex string to Uint8Array
  const secretKey = fromHex(cleanKey);

  // Create keypair from secret key
  return Ed25519Keypair.fromSecretKey(secretKey);
}
