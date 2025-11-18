/**
 * Input Validation Utilities
 *
 * Provides validation helpers for API request parameters.
 */

/**
 * Validate and parse limit parameter for pagination
 * @param limit - Limit value from query params
 * @param defaultLimit - Default limit if not provided
 * @param maxLimit - Maximum allowed limit
 * @returns Validated limit number
 */
export function validateLimit(
  limit: string | undefined,
  defaultLimit: number = 20,
  maxLimit: number = 100
): number {
  if (!limit) {
    return defaultLimit;
  }

  const parsed = parseInt(limit, 10);

  if (isNaN(parsed) || parsed < 1) {
    return defaultLimit;
  }

  return Math.min(parsed, maxLimit);
}

/**
 * Validate Sui address format
 * Basic validation: starts with 0x and is 66 characters (0x + 64 hex chars)
 */
export function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Validate Sui object ID format
 * Same format as address
 */
export function isValidSuiObjectId(objectId: string): boolean {
  return isValidSuiAddress(objectId);
}

/**
 * Sanitize search query
 * Remove special characters that could cause issues
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[%_]/g, '\\$&');
}
