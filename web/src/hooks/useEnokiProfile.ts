/**
 * Enoki Profile Hook
 * Extract user profile information from any Enoki wallet (Google, Facebook, Twitch, etc.)
 */

import { useCurrentWallet } from '@mysten/dapp-kit';
import { 
  getSession, 
  isEnokiWallet, 
  isGoogleWallet,
  isFacebookWallet,
  isTwitchWallet,
  getWalletMetadata,
  type AuthProvider
} from '@mysten/enoki';
import { useEffect, useState, useCallback } from 'react';
import { extractUserProfile } from '@/lib/jwt-utils';

/**
 * User profile information from OAuth providers
 * Works with any Enoki wallet provider (Google, Facebook, Twitch, etc.)
 */
export interface EnokiProfile {
  displayName: string;
  avatarUrl: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  locale?: string;
  provider: 'google' | 'facebook' | 'twitch' | 'unknown';
}

/**
 * @deprecated Use EnokiProfile instead. Kept for backwards compatibility.
 */
export type GoogleProfile = EnokiProfile;

/**
 * Internal hook that handles profile loading logic for any Enoki provider
 * Used by all profile hooks (useEnokiProfile, useGoogleProfile, etc.)
 * 
 * @param providerFilter - Optional filter to only load profile from specific provider
 */
function useEnokiProfileBase(providerFilter?: AuthProvider) {
  const { currentWallet } = useCurrentWallet();
  const [profile, setProfile] = useState<EnokiProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    // Reset if no wallet or not an Enoki wallet
    if (!currentWallet || !isEnokiWallet(currentWallet)) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // If provider filter specified, check if wallet matches
    if (providerFilter) {
      const metadata = getWalletMetadata(currentWallet);
      if (!metadata || metadata.provider !== providerFilter) {
        setProfile(null);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the zkLogin session from the wallet
      const session = await getSession(currentWallet);

      // Check if session has a valid JWT
      if (!session?.jwt) {
        throw new Error('No JWT found in Enoki session');
      }

      // Extract profile from JWT (works with any provider)
      const profileData = extractUserProfile(session.jwt);
      setProfile(profileData as EnokiProfile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Failed to load Enoki profile:', errorMessage);
      setError(errorMessage);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet, providerFilter]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, isLoading, error };
}

/**
 * Hook to extract profile from any Enoki wallet provider
 *
 * Works with all Enoki providers: Google, Facebook, Twitch, etc.
 *
 * This hook:
 * 1. Checks if the current wallet is an Enoki wallet
 * 2. Retrieves the zkLogin session containing the JWT
 * 3. Decodes the JWT to extract profile information
 * 4. Returns the profile with safe defaults
 *
 * @returns EnokiProfile object or null if not logged in with an Enoki wallet
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const profile = useEnokiProfile();
 *
 *   if (!profile) {
 *     return <div>Not logged in</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <img src={profile.avatarUrl} alt={profile.displayName} />
 *       <h1>{profile.displayName}</h1>
 *       <p>{profile.email}</p>
 *       <span>Provider: {profile.provider}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEnokiProfile(): EnokiProfile | null {
  const { profile } = useEnokiProfileBase();
  return profile;
}

/**
 * Hook variant that returns loading and error states
 *
 * @returns Object with profile, isLoading, and error
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { profile, isLoading, error } = useEnokiProfileWithLoading();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!profile) return <div>Not logged in</div>;
 *
 *   return (
 *     <div>
 *       <div>{profile.displayName}</div>
 *       <div>via {profile.provider}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEnokiProfileWithLoading() {
  return useEnokiProfileBase();
}

// ============================================================================
// Provider-Specific Hooks (for convenience and backwards compatibility)
// ============================================================================

/**
 * Hook to extract profile from Google Enoki wallet specifically
 *
 * @deprecated Use useEnokiProfile() for provider-agnostic code.
 * This hook is kept for backwards compatibility and convenience.
 *
 * @returns GoogleProfile object or null if not logged in with Google
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const profile = useGoogleProfile();
 *
 *   if (!profile) {
 *     return <div>Not logged in with Google</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <img src={profile.avatarUrl} alt={profile.displayName} />
 *       <h1>{profile.displayName}</h1>
 *       <p>{profile.email}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGoogleProfile(): GoogleProfile | null {
  const { profile } = useEnokiProfileBase('google');
  return profile;
}

/**
 * Hook variant that returns loading and error states for Google specifically
 *
 * @deprecated Use useEnokiProfileWithLoading() for provider-agnostic code.
 * This hook is kept for backwards compatibility.
 *
 * @returns Object with profile, isLoading, and error
 */
export function useGoogleProfileWithLoading() {
  return useEnokiProfileBase('google');
}

/**
 * Hook to extract profile from Facebook Enoki wallet specifically
 *
 * @returns EnokiProfile object or null if not logged in with Facebook
 */
export function useFacebookProfile(): EnokiProfile | null {
  const { profile } = useEnokiProfileBase('facebook');
  return profile;
}

/**
 * Hook to extract profile from Twitch Enoki wallet specifically
 *
 * @returns EnokiProfile object or null if not logged in with Twitch
 */
export function useTwitchProfile(): EnokiProfile | null {
  const { profile } = useEnokiProfileBase('twitch');
  return profile;
}

