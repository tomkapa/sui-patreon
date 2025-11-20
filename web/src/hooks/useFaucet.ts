/**
 * Custom hook for automatic faucet claim on wallet connection
 *
 * Automatically claims tokens when a wallet connects for the first time.
 * Uses localStorage to track claim status per wallet address.
 *
 * @example
 * const { isLoading } = useFaucet();
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toast } from "@/lib/toast";
import { claimFaucet, FaucetResponse, TokenTransfer } from "@/services/faucet";
import { useEffect, useRef, useState } from "react";

interface CelebrationData {
  digest: string;
  transfers: TokenTransfer[];
}

interface UseFaucetReturn {
  isLoading: boolean;
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
  closeCelebration: () => void;
}

const FAUCET_CLAIM_PREFIX = "faucet_claimed_";

function hasClaimedLocally(walletAddress: string): boolean {
  try {
    return localStorage.getItem(`${FAUCET_CLAIM_PREFIX}${walletAddress}`) === "true";
  } catch {
    return false;
  }
}

function markAsClaimedLocally(walletAddress: string): void {
  try {
    localStorage.setItem(`${FAUCET_CLAIM_PREFIX}${walletAddress}`, "true");
  } catch (error) {
    console.error("Failed to save faucet claim status:", error);
  }
}

export function useFaucet(): UseFaucetReturn {
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  const walletAddress = currentAccount?.address;
  const claimAttemptedRef = useRef<Set<string>>(new Set());

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const mutation = useMutation<FaucetResponse, Error, string>({
    mutationFn: async (address: string) => {
      return await claimFaucet(address);
    },
    onSuccess: (data, walletAddress) => {
      if (data.success) {
        // Success - mark as claimed and show celebration dialog
        markAsClaimedLocally(walletAddress);

        // Set celebration data and show dialog
        setCelebrationData({
          digest: data.digest,
          transfers: data.transfers,
        });
        setShowCelebration(true);

        // Invalidate any balance queries to refresh balances
        queryClient.invalidateQueries({ queryKey: ["balance"] });
      } else {
        // Handle error responses from the API
        if (data.error.includes("already claimed")) {
          // 400: Already claimed - silent, just mark as claimed locally
          markAsClaimedLocally(walletAddress);
        } else if (data.error.includes("insufficient funds")) {
          // 500: Insufficient funds - show informative message
          toast.error("Faucet is currently out of funds", {
            description:
              "Please try again later or contact support for assistance.",
            duration: 7000,
          });
        } else {
          // Other errors
          toast.error("Failed to claim tokens", {
            description: data.error,
            duration: 5000,
          });
        }
      }
    },
    onError: (error: Error) => {
      // Network or unexpected errors
      toast.error("Failed to claim tokens", {
        description:
          error.message || "Network error. Please check your connection and try again.",
        duration: 7000,
      });
    },
  });

  // Auto-trigger claim when wallet connects for the first time
  useEffect(() => {
    if (!walletAddress || mutation.isPending) {
      return;
    }

    // Check if already claimed locally
    if (hasClaimedLocally(walletAddress)) {
      return;
    }

    // Check if we've already attempted to claim for this address in this session
    if (claimAttemptedRef.current.has(walletAddress)) {
      return;
    }

    // Mark as attempted to prevent duplicate calls
    claimAttemptedRef.current.add(walletAddress);

    // Trigger the claim
    mutation.mutate(walletAddress);
  }, [walletAddress, mutation.isPending]);

  const closeCelebration = () => {
    setShowCelebration(false);
    // Keep celebrationData for a bit in case it's needed
    setTimeout(() => setCelebrationData(null), 300);
  };

  return {
    isLoading: mutation.isPending,
    showCelebration,
    celebrationData,
    closeCelebration,
  };
}
