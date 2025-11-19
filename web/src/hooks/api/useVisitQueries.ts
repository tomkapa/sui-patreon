"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { fetchRecentVisits } from "@/services/visits";
import { CreatorProfile } from "@/types";

type RecentVisitsQueryOptions = Omit<
  UseQueryOptions<CreatorProfile[], Error, CreatorProfile[], unknown[]>,
  "queryKey" | "queryFn"
>;

interface UseRecentVisitsParams {
  userAddress: string;
  limit?: number;
}

/**
 * React Query hook for fetching recently visited creators.
 */
export function useRecentVisits(
  { userAddress, limit = 10 }: UseRecentVisitsParams,
  options?: RecentVisitsQueryOptions
) {
  return useQuery({
    queryKey: ["recentVisits", userAddress, limit],
    queryFn: () => fetchRecentVisits(userAddress, limit),
    enabled: Boolean(userAddress),
    ...options,
  });
}

