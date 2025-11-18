import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { config } from './config.js';
import { loadKeypairFromPrivateKey } from './keypair.js';

let suiClient: SuiClient | null = null;
let keypair: Ed25519Keypair | null = null;

export function getSuiClient(): SuiClient {
  if (!suiClient) {
    suiClient = new SuiClient({ url: config.rpcUrl });
  }
  return suiClient;
}

export function getKeypair(): Ed25519Keypair {
  if (!keypair) {
    keypair = loadKeypairFromPrivateKey(config.privateKey);
  }
  return keypair;
}

export function getAddress(): string {
  return getKeypair().getPublicKey().toSuiAddress();
}
