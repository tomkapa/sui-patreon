/**
 * JWT Utilities
 * Utilities for decoding and extracting information from JWT tokens
 * Works with any OAuth provider (Google, Facebook, Twitch, etc.)
 */

/**
 * OAuth JWT Payload Interface
 * Standard claims returned by OAuth providers (Google, Facebook, Twitch, etc.)
 * 
 * Note: Different providers may use different field names for the same data.
 * This interface covers common fields across major providers.
 */
export interface OAuthJwtPayload {
  // User profile information (common across providers)
  name?: string; // Full display name
  picture?: string; // Profile picture URL (Google, Facebook)
  email?: string; // Email address
  email_verified?: boolean;

  // OAuth/JWT standard fields
  sub: string; // Subject (user ID)
  iss: string; // Issuer (identifies the provider)
  aud: string; // Audience (your client ID)
  iat: number; // Issued at
  exp: number; // Expiration time

  // Additional fields (provider-specific but commonly used)
  given_name?: string; // First name
  family_name?: string; // Last name
  locale?: string; // User locale
  
  // Provider-specific fields
  preferred_username?: string; // Twitch username
  picture_url?: string; // Alternative picture field (some providers)
  [key: string]: any; // Allow additional provider-specific fields
}

/**
 * @deprecated Use OAuthJwtPayload instead. This is kept for backwards compatibility.
 */
export type GoogleJwtPayload = OAuthJwtPayload;

/**
 * Decode a JWT token to extract the payload
 *
 * Works with any OAuth provider (Google, Facebook, Twitch, etc.)
 *
 * @param jwt - The JWT token string (format: header.payload.signature)
 * @returns Decoded JWT payload
 * @throws Error if JWT format is invalid or decoding fails
 *
 * @example
 * ```typescript
 * const payload = decodeJwt(jwtToken);
 * console.log(payload.name, payload.email, payload.picture);
 * ```
 */
export function decodeJwt(jwt: string): OAuthJwtPayload {
  try {
    // Split the JWT into parts
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: must have 3 parts');
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 decode (handle URL-safe base64)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 and properly handle UTF-8 characters
    // atob() doesn't handle UTF-8, so we need to decode properly
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode UTF-8 bytes to string
    const jsonPayload = new TextDecoder('utf-8').decode(bytes);

    // Parse JSON
    return JSON.parse(jsonPayload) as OAuthJwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    throw new Error(
      `JWT decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a JWT token is expired
 *
 * @param jwt - The JWT token string or decoded payload
 * @returns True if the token is expired
 */
export function isJwtExpired(jwt: string | OAuthJwtPayload): boolean {
  try {
    const payload = typeof jwt === 'string' ? decodeJwt(jwt) : jwt;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // Consider invalid tokens as expired
  }
}

/**
 * Extract user profile information from JWT
 *
 * Works with any OAuth provider (Google, Facebook, Twitch, etc.)
 * Handles different field names across providers automatically.
 *
 * @param jwt - The JWT token string from any OAuth provider
 * @returns User profile object with safe defaults
 */
export function extractUserProfile(jwt: string) {
  try {
    const payload = decodeJwt(jwt);
    
    // Handle different field names across providers
    const displayName = 
      payload.name || 
      payload.preferred_username || // Twitch
      payload.email || 
      'Anonymous';
      
    const avatarUrl = 
      payload.picture || 
      payload.picture_url || // Some providers use this
      '';
    
    return {
      displayName,
      avatarUrl,
      email: payload.email || '',
      emailVerified: payload.email_verified || false,
      firstName: payload.given_name,
      lastName: payload.family_name,
      locale: payload.locale,
      // Include provider identifier for reference
      provider: identifyProvider(payload.iss),
    };
  } catch (error) {
    console.error('Failed to extract user profile from JWT:', error);
    return {
      displayName: 'Anonymous',
      avatarUrl: '',
      email: '',
      emailVerified: false,
      provider: 'unknown' as const,
    };
  }
}

/**
 * Identify the OAuth provider from the JWT issuer
 *
 * @param issuer - The 'iss' claim from the JWT
 * @returns Provider identifier or 'unknown'
 */
function identifyProvider(issuer: string): 'google' | 'facebook' | 'twitch' | 'unknown' {
  if (!issuer) return 'unknown';
  
  const lower = issuer.toLowerCase();
  
  if (lower.includes('google') || lower.includes('accounts.google.com')) {
    return 'google';
  }
  if (lower.includes('facebook')) {
    return 'facebook';
  }
  if (lower.includes('twitch')) {
    return 'twitch';
  }
  
  return 'unknown';
}

