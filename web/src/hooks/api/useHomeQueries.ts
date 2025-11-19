"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import { fetchHomeCreators, HomeSection } from "@/services/home";
import { CreatorProfile } from "@/types";

type HomeCreatorsQueryData = CreatorProfile[];

type HomeCreatorsQueryOptions = Omit<
  UseQueryOptions<HomeCreatorsQueryData, Error, HomeCreatorsQueryData, unknown[]>,
  "queryKey" | "queryFn"
>;

interface UseHomeCreatorsParams {
  section: HomeSection;
  limit?: number;
  userAddress?: string;
}

/**
 * React Query hook for fetching homepage creators.
 */
export function useHomeCreators(
  { section, limit = 8, userAddress }: UseHomeCreatorsParams,
  options?: HomeCreatorsQueryOptions
) {
  return useQuery({
    queryKey: ["homeCreators", section, limit, userAddress],
    queryFn: () => fetchHomeCreators(section, limit, userAddress),
    ...options,
  });
}

