"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";

import {
  fetchLibraryPosts,
  LibraryQueryParams,
  LibraryResponse,
} from "@/services/library";

type LibraryQueryOptions = Omit<
  UseQueryOptions<LibraryResponse, Error, LibraryResponse, unknown[]>,
  "queryKey" | "queryFn"
>;

interface UseLibraryPostsParams extends LibraryQueryParams {
  creatorAddress: string;
}

/**
 * React Query hook for fetching creator library posts.
 */
export function useLibraryPosts(
  { creatorAddress, ...params }: UseLibraryPostsParams,
  options?: LibraryQueryOptions
) {
  return useQuery({
    queryKey: ["libraryPosts", creatorAddress, params],
    queryFn: () => fetchLibraryPosts(creatorAddress, params),
    enabled: Boolean(creatorAddress),
    ...options,
  });
}

