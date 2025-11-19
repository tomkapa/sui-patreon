/**
 * Hook to create a new subscription tier on Sui blockchain
 *
 * Follows the pattern from docs/sui/sdk.md and existing useTransaction hook
 */

import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { useTransaction } from './useTransaction';
import { PACKAGE_ID, TIER_REGISTRY, usdcToSmallestUnit } from '@/lib/sui/constants';

export interface CreateTierParams {
  name: string;
  description: string;
  monthlyPrice: number; // in USDC (e.g., 5.00)
  onSuccess?: () => void;
}

export function useCreateTier() {
  const { execute, isLoading } = useTransaction();

  const createTier = async (params: CreateTierParams) => {
    const { name, description, monthlyPrice, onSuccess } = params;

    // Convert USDC to smallest unit (6 decimals)
    const priceInSmallestUnit = usdcToSmallestUnit(monthlyPrice);

    return execute(
      (tx) => {
        tx.moveCall({
          target: `${PACKAGE_ID}::subscription::create_tier`,
          arguments: [
            tx.object(TIER_REGISTRY),
            tx.pure.string(name),
            tx.pure.string(description),
            tx.pure.u64(priceInSmallestUnit),
            tx.object(SUI_CLOCK_OBJECT_ID),
          ],
        });
      },
      {
        successMessage: 'Tier created successfully!',
        errorMessage: 'Failed to create tier',
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
    createTier,
    isLoading,
  };
}
