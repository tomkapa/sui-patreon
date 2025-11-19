'use client';

import { useMessaging } from '@/hooks/useMessaging';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSessionKey } from '@/providers/SessionKeyProvider';
import { Button } from '@/components/ui/button';

export function MessagingStatus() {
  const currentAccount = useCurrentAccount();
  const { client, sessionKey, isInitializing, error, isReady } = useMessaging();
  const { initializeManually } = useSessionKey();

  return (
    <div className="rounded-xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight">Messaging Status</h3>
          <div className={`h-3 w-3 rounded-full ${
            isReady ? 'bg-green-500 animate-pulse' :
            isInitializing ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-400'
          }`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg bg-background/60 p-3 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
            <div className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
              currentAccount ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
            }`}>
              {currentAccount?.address
                ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
                : 'Not connected'}
            </div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Session Key</span>
            <div className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
              sessionKey ? 'bg-green-500/10 text-green-600' :
              isInitializing ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-gray-500/10 text-gray-600'
            }`}>
              {isInitializing ? 'Initializing...' : sessionKey ? 'Active' : 'Not initialized'}
            </div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</span>
            <div className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
              client ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
            }`}>
              {client ? 'Ready' : 'Not initialized'}
            </div>
          </div>

          <div className="rounded-lg bg-background/60 p-3 border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
            <div className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
              isReady ? 'bg-green-500/10 text-green-600' :
              isInitializing ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-red-500/10 text-red-600'
            }`}>
              {isReady ? 'Ready to use' : isInitializing ? 'Setting up...' : 'Not ready'}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
            <p className="text-sm font-medium text-red-600">Error: {error.message}</p>
          </div>
        )}

        {currentAccount && !sessionKey && !isInitializing && (
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              The SDK uses Seal for encrypting messages. A session key is required, which allows the app to retrieve
              decryption keys for 30 minutes without repeated confirmations.
            </p>
            <Button
              onClick={initializeManually}
              size="sm"
              className="w-full sm:w-auto"
            >
              Sign Session Key
            </Button>
          </div>
        )}

        {isReady && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4">
            <p className="text-sm font-medium text-green-600 flex items-center gap-2">
              <span className="text-lg">✓</span>
              Messaging client is ready! You can now send and receive messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

