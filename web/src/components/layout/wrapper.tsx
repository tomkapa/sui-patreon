'use client';
import {
  createNetworkConfig,
  SuiClientProvider,
  useSuiClientContext,
  WalletProvider,
} from '@mysten/dapp-kit';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const queryClient = new QueryClient();
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});
function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider network='testnet' networks={networkConfig}>
        <RegisterEnokiWallets />
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();
  useEffect(() => {
    if (!isEnokiNetwork(network)) return;
    if (
      !process.env.NEXT_PUBLIC_ENOKI_API_KEY ||
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    )
      throw new Error(
        'NEXT_PUBLIC_ENOKI_API_KEY or NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set'
      );
    const { unregister } = registerEnokiWallets({
      apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY,
      providers: {
        // Provide the client IDs for each of the auth providers you want to use:
        google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          redirectUrl:
            (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') +
            '/auth/callback',
          extraParams: {
            redirect_uri:
              process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            response_type: 'id_token',
            scope: 'openid email profile',
          },
        },
      },
      client,
      network,
    });
    return unregister;
  }, [client, network]);
  return null;
}

export default AppWrapper;
