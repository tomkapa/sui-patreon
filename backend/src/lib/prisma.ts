/**
 * Prisma Client Singleton
 *
 * Provides a single instance of PrismaClient throughout the application.
 * Prevents multiple instances in development due to hot reloading.
 */

import { PrismaClient } from '@prisma/client';

// Global type extension for development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client instance with logging in development
 */
const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

/**
 * Singleton instance of PrismaClient
 * In development, uses global to prevent multiple instances during hot reload
 * In production, creates a single instance
 */
export const prisma = globalThis.prisma ?? createPrismaClient();

// Store on global in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Disconnects Prisma Client when process terminates
 */
export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};

// Register shutdown handlers
process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});
