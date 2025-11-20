const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Token transfer information
 */
export interface TokenTransfer {
  coinType: string;
  amount: string;
}

/**
 * API response for successful faucet claim
 */
export interface FaucetSuccessResponse {
  success: true;
  digest: string;
  transfers: TokenTransfer[];
}

/**
 * API response for faucet errors
 */
export interface FaucetErrorResponse {
  success: false;
  error: string;
}

/**
 * Combined response type
 */
export type FaucetResponse = FaucetSuccessResponse | FaucetErrorResponse;

/**
 * Claim free tokens from the faucet
 *
 * @param walletAddress - User's wallet address
 * @returns Promise with success status, transaction digest, or error message
 * @throws Error if request fails
 */
export async function claimFaucet(
  walletAddress: string
): Promise<FaucetResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await response.json();

    if (response.ok) {
      // 200: Success
      return {
        success: true,
        digest: data.digest,
        transfers: data.transfers || [],
      };
    }

    // Handle error responses
    if (response.status === 400) {
      // Already claimed
      return {
        success: false,
        error: data.error || "You have already claimed tokens",
      };
    }

    if (response.status === 500) {
      // Insufficient funds
      return {
        success: false,
        error: data.error || "Faucet wallet has insufficient funds",
      };
    }

    // Unexpected error
    return {
      success: false,
      error: data.error || `Unexpected error: ${response.statusText}`,
    };
  } catch (error) {
    console.error("Error claiming faucet:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Network error: Unable to connect to faucet service"
    );
  }
}
