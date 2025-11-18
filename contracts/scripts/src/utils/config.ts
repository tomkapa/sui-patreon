import dotenv from 'dotenv';
import { getFullnodeUrl } from '@mysten/sui/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from contracts/scripts directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface Config {
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  rpcUrl: string;
  privateKey: string;
  packageId: string | null;
}

export function loadConfig(): Config {
  const network = (process.env.SUI_NETWORK || 'testnet') as Config['network'];
  const privateKey = process.env.PRIVATE_KEY;
  const packageId = process.env.PACKAGE_ID || null;

  if (!privateKey) {
    throw new Error(
      'PRIVATE_KEY not found in environment variables. Please set it in contracts/scripts/.env'
    );
  }

  // Get RPC URL
  let rpcUrl: string;
  if (process.env.RPC_URL) {
    rpcUrl = process.env.RPC_URL;
  } else {
    rpcUrl = getFullnodeUrl(network);
  }

  return {
    network,
    rpcUrl,
    privateKey,
    packageId,
  };
}

export const config = loadConfig();
