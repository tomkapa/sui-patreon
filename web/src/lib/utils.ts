import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Sui address for display (shortened)
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Convert topic/category name to URL-friendly slug
 */
export function topicNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Convert slug back to topic name (for display)
 */
export function slugToTopicName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\band\b/g, "&")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Token decimals configuration
 */
const TOKEN_DECIMALS: Record<string, number> = {
  "0x2::sui::SUI": 9,
  SUI: 9,
  USDC: 6,
  WAL: 9,
};

/**
 * Format token balance with decimals
 */
export function formatBalance(amount: string, decimals: number): string {
  const num = BigInt(amount);
  const divisor = BigInt(Math.pow(10, decimals));
  const whole = num / divisor;
  const fraction = num % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, "0");
  // Trim trailing zeros
  const trimmed = fractionStr.replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}

/**
 * Extract token symbol from coin type
 */
export function extractTokenSymbol(coinType: string): string {
  // Handle full coin type like "0x2::sui::SUI"
  if (coinType.includes("::")) {
    const parts = coinType.split("::");
    return parts[parts.length - 1];
  }
  return coinType;
}

/**
 * Format token transfers for display
 */
export function formatTokenTransfers(
  transfers: Array<{ coinType: string; amount: string }>
): string {
  return transfers
    .map((t) => {
      const symbol = extractTokenSymbol(t.coinType);
      const decimals = TOKEN_DECIMALS[t.coinType] || TOKEN_DECIMALS[symbol] || 0;
      const formattedAmount = formatBalance(t.amount, decimals);
      return `${formattedAmount} ${symbol}`;
    })
    .join(", ");
}

