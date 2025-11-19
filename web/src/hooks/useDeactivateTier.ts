/**
 * Hook to deactivate a subscription tier on Sui blockchain
 *
 * Follows the pattern from docs/sui/sdk.md and existing useTransaction hook
 */

import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { useTransaction } from './useTransaction';
import { PACKAGE_ID, TIER_REGISTRY } from '@/lib/sui/constants';

export interface DeactivateTierParams {
  tierId: string;
  onSuccess?: () => void;
}

export function useDeactivateTier() {
  const { execute, isLoading } = useTransaction();

  const deactivateTier = async (params: DeactivateTierParams) => {
    const { tierId, onSuccess } = params;

    return execute(
      (tx) => {
        tx.moveCall({
          target: `${PACKAGE_ID}::subscription::deactivate_tier`,
          arguments: [
            tx.object(TIER_REGISTRY),
            tx.pure.id(tierId),
            tx.object(SUI_CLOCK_OBJECT_ID),
          ],
        });
      },
      {
        successMessage: 'Tier deactivated successfully!',
        errorMessage: 'Failed to deactivate tier',
        onSuccess: () => {
          // Wait 3 seconds before refetching to allow blockchain to index
          setTimeout(() => {
            onSuccess?.();
          }, 3000);
        },
      }
    );
  };

  return {
    deactivateTier,
    isLoading,
  };
}
