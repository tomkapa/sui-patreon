/**
 * Sui Platform Constants
 */

import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

// Contract Configuration
export const PACKAGE_ID =
  '0x1caafd43a5da2f0668b505533cc72208db7f94f5f9bb86f26a5ebb2476de3787';

export const PROFILE_REGISTRY =
  '0xee65eb125108c861547a574fdbe0463857426a30dbe38ed985cabaac76dbe881';

export const TIER_REGISTRY =
  '0x02e7083f1b1c481fbf97b9d14b413a7f46707bef0a7d761b9faeea0bb42adb92';

export const CONTENT_REGISTRY =
  '0x5e907d8cbd38f9f99b8704deb76c193a1bb432bad42f510c1416555b1bed8a86';

// System Objects
export { SUI_CLOCK_OBJECT_ID };

// WALRUS Configuration
export const WALRUS_TYPE =
  '0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL';

// USDC Configuration (Testnet)
export const USDC_TYPE =
  '0x952d02f492d8a48393294a25055efb8bb965e04fd012634f33e533b41801fc8c::usdc::USDC';
export const USDC_DECIMALS = 6;

/**
 * Convert USDC amount to smallest unit (6 decimals)
 * @param amount - Amount in USDC (e.g., 5 for 5 USDC)
 * @returns Amount in smallest unit (e.g., 5000000)
 */
export function usdcToSmallestUnit(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
}

/**
 * Convert smallest unit to USDC amount
 * @param amount - Amount in smallest unit (e.g., 5000000)
 * @returns Amount in USDC (e.g., 5)
 */
export function smallestUnitToUsdc(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS;
}
