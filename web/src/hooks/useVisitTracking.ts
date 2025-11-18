/**
 * Visit tracking hook
 *
 * Provides a convenient way to track creator profile visits from React components.
 * Automatically handles user address retrieval and non-blocking API calls.
 */

import { useCallback } from "react";
import { trackVisit } from "@/services/visits";
import { getUserAddress } from "@/lib/user-session";

export interface UseVisitTrackingReturn {
  /**
   * Track a visit to a creator profile
   *
   * This function:
   * - Automatically gets the current user's address
   * - Tracks the visit in the background (non-blocking)
   * - Handles errors gracefully without affecting UI
   *
   * @param creatorAddress - The Sui address of the creator being visited
   */
  trackCreatorVisit: (creatorAddress: string) => void;
}

/**
 * Hook for tracking creator profile visits
 *
 * @example
 * ```tsx
 * function CreatorProfile({ creatorAddress }: Props) {
 *   const { trackCreatorVisit } = useVisitTracking();
 *
 *   useEffect(() => {
 *     trackCreatorVisit(creatorAddress);
 *   }, [creatorAddress, trackCreatorVisit]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useVisitTracking(): UseVisitTrackingReturn {
  const trackCreatorVisit = useCallback((creatorAddress: string) => {
    // Validate input
    if (!creatorAddress) {
      console.warn("useVisitTracking: creatorAddress is required");
      return;
    }

    // Get user address (will be empty string on server)
    const userAddress = getUserAddress();

    // Track visit in background - don't block UI
    // The trackVisit function already handles errors gracefully
    if (userAddress) {
      // Don't await - this is intentionally fire-and-forget
      void trackVisit(creatorAddress, userAddress);
    }
  }, []);

  return { trackCreatorVisit };
}
