/**
 * User session management utilities
 *
 * Manages user address persistence for visit tracking and other features.
 * Currently uses localStorage for session persistence.
 * Will be integrated with wallet authentication in the future.
 */

const USER_ADDRESS_KEY = "sui_user_session_address";

/**
 * Generate a mock user address for testing
 * Format: 0x + 40 hex characters (valid Sui address format)
 */
function generateMockUserAddress(): string {
  // Generate random hex string
  const randomHex = Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  return `0x${randomHex}`;
}

/**
 * Get or create a session user address
 *
 * This function:
 * 1. Checks localStorage for an existing session address
 * 2. If not found, generates a new mock address and saves it
 * 3. Returns the address for use in API calls
 *
 * @returns The current user's session address
 */
export function getUserAddress(): string {
  if (typeof window === "undefined") {
    // Server-side rendering - return a placeholder
    return "";
  }

  try {
    // Check for existing session address
    const savedAddress = localStorage.getItem(USER_ADDRESS_KEY);

    if (savedAddress) {
      return savedAddress;
    }

    // Generate and save new address
    const newAddress = generateMockUserAddress();
    localStorage.setItem(USER_ADDRESS_KEY, newAddress);

    return newAddress;
  } catch (error) {
    console.error("Failed to get/set user address:", error);
    // Return a default address if localStorage fails
    return "0x0000000000000000000000000000000000000000";
  }
}

/**
 * Clear the current user session
 * Useful for testing or logout functionality
 */
export function clearUserSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(USER_ADDRESS_KEY);
  } catch (error) {
    console.error("Failed to clear user session:", error);
  }
}

/**
 * Set a specific user address (useful for testing or wallet integration)
 *
 * @param address - The Sui address to set as current user
 */
export function setUserAddress(address: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(USER_ADDRESS_KEY, address);
  } catch (error) {
    console.error("Failed to set user address:", error);
  }
}
