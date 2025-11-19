/**
 * Custom hook for executing Sui transactions with loading states and toast notifications
 *
 * Follows patterns from docs/sui/sdk.md
 *
 * @example
 * const { execute, isLoading } = useTransaction();
 *
 * await execute(
 *   (tx) => {
 *     tx.moveCall({ target: `${PACKAGE_ID}::profile::create_profile`, ... });
 *   },
 *   {
 *     successMessage: 'Profile created successfully!',
 *     errorMessage: 'Failed to create profile',
 *   }
 * );
 */

import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { useState } from 'react';

export interface TransactionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (digest: string) => void;
  onError?: (error: Error) => void;
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
      const explorerUrl = `https://suiscan.xyz/testnet/tx/${result.digest}`;
      toast.info('Transaction sent', {
        description: `View on Explorer: ${explorerUrl}`,
        action: {
          label: 'View',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
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

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(result.digest);
      }

      return result;
    } catch (error: any) {
      // Show error toast
      toast.error(options.errorMessage || 'Transaction failed', {
        description: error.message || 'Unknown error occurred',
        duration: 7000,
      });

      // Call error callback
      if (options.onError && error instanceof Error) {
        options.onError(error);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading };
}
