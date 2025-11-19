'use client';

import { Button } from '@/components/ui/button';
import { useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { isEnokiWallet } from '@mysten/enoki';
import { LogIn } from 'lucide-react';
import { useState } from 'react';

/**
 * Login button with zkLogin integration
 * Implements Google OAuth with zero-knowledge proofs for Sui authentication
 */
export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { mutateAsync: connect } = useConnectWallet();
  const wallets = useWallets();

  const handleLogin = async () => {
    const googleWallet = wallets.find(
      (wallet) => isEnokiWallet(wallet) && wallet.provider === 'google'
    );
    if (!googleWallet) {
      setError('Google wallet not found');
      return;
    }
    setIsLoading(true);
    try {
      await connect({ wallet: googleWallet });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <>
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
            Connecting...
          </>
        ) : (
          <>
            <LogIn className='mr-2 h-4 w-4' />
            Log in with Google
          </>
        )}
      </Button>

      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  );
}
