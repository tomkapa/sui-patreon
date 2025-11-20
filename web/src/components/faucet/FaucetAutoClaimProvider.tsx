'use client';

import { useFaucet } from '@/hooks/useFaucet';
import { FaucetCelebrationDialog } from './FaucetCelebrationDialog';

/**
 * Faucet auto-claim provider component
 *
 * Automatically claims free testnet tokens when a wallet connects for the first time.
 * Uses localStorage to track claim status per wallet address to prevent duplicate claims.
 * Shows a celebration dialog when tokens are successfully claimed.
 *
 * This component should be placed in the root layout or a component that:
 * - Renders on all pages
 * - Has access to wallet connection state
 * - Doesn't unmount when navigating
 *
 * @example
 * <FaucetAutoClaimProvider />
 */
export function FaucetAutoClaimProvider() {
  const { showCelebration, celebrationData, closeCelebration } = useFaucet();

  return (
    <FaucetCelebrationDialog
      open={showCelebration}
      onClose={closeCelebration}
      digest={celebrationData?.digest}
      transfers={celebrationData?.transfers}
    />
  );
}
