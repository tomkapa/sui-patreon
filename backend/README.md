# Backend

Sui Patreon Backend API built with Express 5, Bun runtime, and Prisma 6.

## Features

- **Bun Runtime**: Fast startup and execution with native TypeScript support
- **Express 5**: Modern Express server with async/await support
- **CORS**: Configured for frontend origin with credentials support
- **Body Parsing**: 50MB limit for file uploads
- **Type Safety**: Full TypeScript with strict mode enabled
- **Error Handling**: Centralized error middleware
- **Testing**: Comprehensive test suite with Bun's native test runner

## Prerequisites

- Bun 1.0+ installed
- PostgreSQL database (for Prisma)
- Node.js 18+ (optional, for some tools)

## Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run prisma:generate

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

## Environment Variables

Required environment variables in `.env`:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sui_patreon

# Sui Blockchain
PACKAGE_ID=0x...
SUI_NETWORK=testnet

# Walrus Storage
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Seal Encryption
SEAL_PACKAGE_ID=0x...
# Optional: Custom key server configurations (JSON array)
# SEAL_KEY_SERVERS=[{"objectId":"0x...","weight":1}]

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
```

## Development

```bash
# Start development server with hot reload
bun run dev

# Start blockchain event indexer
bun run dev:indexer

# Run tests
bun test

# Type checking
bunx tsc --noEmit

# Run linter
bun run lint
```

## Production

```bash
# Start production server (uses unbundled source for compatibility)
bun run start

# Or with custom port
PORT=8080 bun run start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "runtime": "bun",
  "timestamp": "2025-11-17T17:00:00.000Z",
  "version": "1.0.0"
}
```

## Architecture

- `/src/index.ts` - Express server entry point
- `/src/indexer.ts` - Blockchain event indexer
- `/src/routes/` - API route handlers
- `/src/controllers/` - Request/response handling
- `/src/services/` - Business logic layer
  - `storage.service.ts` - Walrus decentralized storage
  - `encryption.service.ts` - Seal encryption with policy-based access control
- `/src/repositories/` - Data access layer
- `/src/lib/` - Utilities and helpers
- `/src/types/` - TypeScript type definitions
- `/src/middleware/` - Express middleware

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/index.test.ts

# Run tests with coverage
bun test --coverage
```

### Test Coverage

The test suite covers:
- Health endpoint functionality
- CORS configuration
- Body parsing (up to 50MB)
- Error handling
- Performance benchmarks
- Environment configuration
- Walrus storage operations (upload, download, exists)
- Seal encryption/decryption with policy-based access control
- Buffer ↔ Uint8Array conversions

## Performance

- **Startup Time**: < 100ms (with Bun runtime)
- **Response Time**: < 1ms average for health check
- **Concurrent Requests**: Handles 100+ simultaneous requests
- **Body Limit**: 50MB for file uploads

## Database

```bash
# Run migrations
bun run prisma:migrate

# Open Prisma Studio
bun run prisma:studio

# Generate Prisma client
bun run prisma:generate
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### TypeScript Errors

```bash
# Regenerate Prisma client
bun run prisma:generate

# Check for type errors
bunx tsc --noEmit
```

### Environment Variables Not Loading

Make sure `.env` file exists in the backend directory:
```bash
cp .env.example .env
```

## Notes

- The production build uses unbundled source (`bun src/index.ts`) instead of the bundled output due to compatibility issues with certain Node.js modules in Bun's bundler
- The server uses `import.meta.main` to prevent auto-starting when imported as a module (for testing)
- CORS is configured to allow credentials and only accept requests from the configured frontend URL
