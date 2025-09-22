#!/usr/bin/env node

// Test environment variables loading
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('=== Environment Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID);
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET);
console.log('ZOHO_REDIRECT_URI:', process.env.ZOHO_REDIRECT_URI);
console.log('========================');