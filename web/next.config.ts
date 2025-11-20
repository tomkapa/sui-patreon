import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'aggregator.walrus-testnet.walrus.space',
        pathname: '/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'minio.7k.ag',
        pathname: '/sui-patreon/**',
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Explicitly disable image optimization size limits
    minimumCacheTTL: 60,
    // Allow unoptimized images as fallback
    unoptimized: process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT !== undefined ? false : false,
  },
};

export default nextConfig;
