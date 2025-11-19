/**
 * Hook to fetch creator's subscription tiers from backend
 */

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

interface Tier {
  id: string;
  tierId: string;
  creatorId: string;
  name: string;
  description: string;
  price: string; // bigint serialized as string
  isActive: boolean;
  createdAt: string;
  subscriberCount: number;
}

interface CreatorTiersData {
  creator: {
    id: string;
    address: string;
    name: string;
    avatarUrl: string;
  };
  tiers: Tier[];
}

export function useCreatorTiers(includeInactive = true) {
  const account = useCurrentAccount();
  const [data, setData] = useState<CreatorTiersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!account?.address) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchTiers() {
      try {
        setIsLoading(true);
        setError(null);

        const url = new URL(
          `/api/tiers/creator/${account!.address}`,
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        );

        if (includeInactive) {
          url.searchParams.set('includeInactive', 'true');
        }

        console.log('[useCreatorTiers] Fetching tiers from:', url.toString());
        const response = await fetch(url.toString());

        if (!response.ok) {
          if (response.status === 404) {
            // Creator not found - not an error, just no tiers
            if (!isCancelled) {
              setData(null);
            }
            return;
          }
          throw new Error(`Failed to fetch tiers: ${response.statusText}`);
        }

        const result = await response.json();

        if (!isCancelled) {
          console.log('[useCreatorTiers] Fetched tiers:', result);
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch creator tiers:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTiers();

    return () => {
      isCancelled = true;
    };
  }, [account?.address, includeInactive, refetchTrigger]);

  const refetch = () => {
    if (!account?.address) {
      console.log('[useCreatorTiers] Refetch called but no account address');
      return;
    }

    console.log('[useCreatorTiers] Refetch triggered');
    // Trigger a refetch by incrementing the trigger
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    data,
    tiers: data?.tiers || [],
    creator: data?.creator,
    isLoading,
    error,
    refetch,
  };
}
