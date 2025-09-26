/**
 * Run the ultra-simplified permission service test
 * 
 * Usage: node -r ts-node/register src/tests/permissionService.test.ts
 */

import { testUltraSimplifiedService } from '../tests/permissionService.test';

console.log('🚀 Running Ultra-Simplified Permission Service Test');
console.log('==================================================\n');

testUltraSimplifiedService()
  .then(() => {
    console.log('\n🎉 Test execution completed successfully!');
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  });