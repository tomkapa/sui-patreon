'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { CreatorProfileData, fetchCreatorProfile } from '@/services/creator';

type CreatorProfileQueryOptions = Omit<
  UseQueryOptions<CreatorProfileData, Error, CreatorProfileData, unknown[]>,
  'queryKey' | 'queryFn'
>;

/**
 * React Query hook for fetching a creator profile.
 */
export function useCreatorProfile(
  address?: string,
  options?: CreatorProfileQueryOptions
) {
  return useQuery({
    queryKey: ['creatorProfile', address],
    queryFn: () => fetchCreatorProfile(address!),
    enabled: Boolean(address),
    ...options,
  });
}
