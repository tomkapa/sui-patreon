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
}

/**
 * Fetch newly joined creators.
 */
export function useNewCreators(
  { limit = 6, offset = 0 }: UseNewCreatorsParams = {},
  options?: NewCreatorsQueryOptions
) {
  return useQuery({
    queryKey: ["newCreators", limit, offset],
    queryFn: () => fetchNewCreators(limit, offset),
    ...options,
  });
}

interface UseCreatorsByCategoryParams {
  category: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch creators filtered by category.
 */
export function useCreatorsByCategory(
  { category, limit = 9, offset = 0 }: UseCreatorsByCategoryParams,
  options?: CreatorsByCategoryQueryOptions
) {
  return useQuery({
    queryKey: ["creatorsByCategory", category, limit, offset],
    queryFn: () => fetchCreatorsByCategory(category, limit, offset),
    enabled: Boolean(category),
    ...options,
  });
}

