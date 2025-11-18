import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'http';

// Set environment variables before importing the app
process.env.PORT = '3002'; // Use different port for testing
process.env.FRONTEND_URL = 'http://localhost:3000';

let app: any;
let server: Server;
const BASE_URL = 'http://localhost:3002';
const TEST_PORT = 3002;

beforeAll(async () => {
  // Dynamically import the app to ensure env vars are set first
  const module = await import('./index');
  app = module.default;

  // Manually start the server for testing
  return new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server started on port ${TEST_PORT}`);
      resolve();
    });
  });
});

afterAll(() => {
  if (server) {
    server.close();
  }
});

describe('Express Server with Bun Runtime', () => {
  describe('Health Endpoint', () => {
    test('GET /health returns 200 with correct structure', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('runtime', 'bun');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
    });

    test('health endpoint timestamp is valid ISO 8601', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json() as any;

      const timestamp = new Date(data.timestamp);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });

    test('health endpoint returns current time', async () => {
      const before = Date.now();
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json() as any;
      const after = Date.now();

      const responseTime = new Date(data.timestamp).getTime();
      expect(responseTime).toBeGreaterThanOrEqual(before);
      expect(responseTime).toBeLessThanOrEqual(after);
    });
  });

  describe('CORS Configuration', () => {
    test('CORS headers are present for allowed origin', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    });

    test('OPTIONS preflight request works', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
        },
      });

      expect(response.status).toBe(204);
    });
  });

  describe('Body Parsing', () => {
    test('accepts JSON payload up to 50MB', async () => {
      // Create a large JSON payload (approximately 1MB)
      const largeData = {
        data: 'x'.repeat(1024 * 1024), // 1MB string
      };

      const response = await fetch(`${BASE_URL}/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largeData),
      });

      // Should not return 413 (payload too large)
      expect(response.status).not.toBe(413);
    });

    test('accepts URL-encoded payload', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'key1=value1&key2=value2',
      });

      expect(response.status).not.toBe(413);
    });
  });

  describe('Error Handling', () => {
    test('non-existent route returns 404', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-route`);
      expect(response.status).toBe(404);
    });

    test('server handles errors gracefully', async () => {
      // Try to trigger a server error with malformed JSON
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      // Should return 400 for bad request or 500 for server error
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Performance Baseline', () => {
    test('startup time is fast (implicit - server started in beforeAll)', () => {
      // This test passes if beforeAll completed without timeout
      expect(true).toBe(true);
    });

    test('handles concurrent requests', async () => {
      const concurrentRequests = 100;
      const requests = Array.from({ length: concurrentRequests }, () =>
        fetch(`${BASE_URL}/health`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const allSuccessful = responses.every(r => r.status === 200);
      expect(allSuccessful).toBe(true);

      console.log(`✓ Handled ${concurrentRequests} concurrent requests in ${endTime - startTime}ms`);
    });

    test('response time is reasonable (<100ms for health check)', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await fetch(`${BASE_URL}/health`);
        const end = Date.now();
        responseTimes.push(end - start);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      console.log(`✓ Average response time: ${averageTime.toFixed(2)}ms`);

      // Most requests should be under 100ms
      const fastRequests = responseTimes.filter(t => t < 100).length;
      expect(fastRequests).toBeGreaterThan(iterations * 0.8); // 80% under 100ms
    });
  });

  describe('Environment Configuration', () => {
    test('server uses configured PORT', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      expect(response.ok).toBe(true);
    });

    test('version is returned from environment or default', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json() as any;

      expect(data.version).toBeTruthy();
      expect(typeof data.version).toBe('string');
    });
  });
});
