"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import {
  fetchCategories,
  fetchCreatorsByCategory,
  fetchNewCreators,
} from "@/services/explore";
import { ExploreCategory, ExploreCreator } from "@/types";

type CategoriesQueryOptions = Omit<
  UseQueryOptions<ExploreCategory[], Error, ExploreCategory[], unknown[]>,
  "queryKey" | "queryFn"
>;

type NewCreatorsQueryOptions = Omit<
  UseQueryOptions<ExploreCreator[], Error, ExploreCreator[], unknown[]>,
  "queryKey" | "queryFn"
>;

type CreatorsByCategoryQueryOptions = Omit<
  UseQueryOptions<ExploreCreator[], Error, ExploreCreator[], unknown[]>,
  "queryKey" | "queryFn"
>;

/**
 * Fetch all explore categories.
 */
export function useExploreCategories(options?: CategoriesQueryOptions) {
  return useQuery({
    queryKey: ["exploreCategories"],
    queryFn: fetchCategories,
    ...options,
  });
}

interface UseNewCreatorsParams {
  limit?: number;
  offset?: number;
  userAddress?: string;
}

/**
 * Fetch newly joined creators.
 */
export function useNewCreators(
  { limit = 6, offset = 0, userAddress }: UseNewCreatorsParams = {},
  options?: NewCreatorsQueryOptions
) {
  return useQuery({
    queryKey: ["newCreators", limit, offset, userAddress],
    queryFn: () => fetchNewCreators(limit, offset, userAddress),
    ...options,
  });
}

interface UseCreatorsByCategoryParams {
  category: string;
  limit?: number;
  offset?: number;
  userAddress?: string;
}

/**
 * Fetch creators filtered by category.
 */
export function useCreatorsByCategory(
  { category, limit = 9, offset = 0, userAddress }: UseCreatorsByCategoryParams,
  options?: CreatorsByCategoryQueryOptions
) {
  return useQuery({
    queryKey: ["creatorsByCategory", category, limit, offset, userAddress],
    queryFn: () => fetchCreatorsByCategory(category, limit, offset, userAddress),
    enabled: Boolean(category),
    ...options,
  });
}

