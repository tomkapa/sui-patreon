/**
 * JSON Serialization Utilities
 *
 * Handles serialization of special types (BigInt, Date) to JSON-safe formats.
 * Required for Prisma models that use BigInt for price fields.
 */

/**
 * Convert BigInt values to strings in an object
 * Recursively processes nested objects and arrays
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return String(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as T;
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized as T;
  }

  return obj;
}

/**
 * JSON response helper that automatically serializes BigInt
 * Use this instead of res.json() for responses containing BigInt
 */
export function jsonResponse(data: unknown): unknown {
  return serializeBigInt(data);
}
