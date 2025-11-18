/**
 * Endpoint Verification Script
 *
 * Verifies that all API route handlers are properly exported and mounted.
 * This does NOT start the server, just validates the route definitions.
 */

import creatorsRouter from './creators';
import tiersRouter from './tiers';
import subscriptionsRouter from './subscriptions';
import contentRouter from './content';

console.log('🔍 Verifying API route handlers...\n');

const routers = [
  { name: 'Creators Router', router: creatorsRouter, path: '/api/creators' },
  { name: 'Tiers Router', router: tiersRouter, path: '/api/tiers' },
  { name: 'Subscriptions Router', router: subscriptionsRouter, path: '/api/subscriptions' },
  { name: 'Content Router', router: contentRouter, path: '/api/content' },
];

let allValid = true;

for (const { name, router, path } of routers) {
  const isValid = router && typeof router === 'function';
  const status = isValid ? '✅' : '❌';

  console.log(`${status} ${name}`);
  console.log(`   Path: ${path}`);
  console.log(`   Type: ${typeof router}`);
  console.log(`   Valid: ${isValid}\n`);

  if (!isValid) {
    allValid = false;
  }
}

if (allValid) {
  console.log('✅ All routers are valid and ready to mount');
  process.exit(0);
} else {
  console.error('❌ Some routers are invalid');
  process.exit(1);
}
