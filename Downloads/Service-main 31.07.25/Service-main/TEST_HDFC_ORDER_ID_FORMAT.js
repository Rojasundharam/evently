// Test script for HDFC-compatible order ID format
const crypto = require('crypto');

function generateHDFCCompatibleOrderId() {
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8); // Shorter UUID fragment
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Shorter random
  
  // HDFC-compatible format: ORD + timestamp + random + short uuid
  return `ORD${timestamp}${random}${uuid}`;
}

// Test the new format
console.log('=== HDFC-Compatible Order ID Test ===');
console.log('');

// Generate multiple order IDs to test
for (let i = 1; i <= 5; i++) {
  const orderId = generateHDFCCompatibleOrderId();
  console.log(`Order ID ${i}: ${orderId}`);
  console.log(`Length: ${orderId.length} characters`);
  console.log(`Format: ORD + ${orderId.substring(3, 16)} (timestamp) + ${orderId.substring(16, 19)} (random) + ${orderId.substring(19)} (uuid)`);
  console.log('');
}

// Validate format
const testOrderId = generateHDFCCompatibleOrderId();
const formatRegex = /^ORD[0-9]{13}[0-9]{3}[a-f0-9]{8}$/;
const isValid = formatRegex.test(testOrderId);

console.log('=== Format Validation ===');
console.log(`Test Order ID: ${testOrderId}`);
console.log(`Valid Format: ${isValid}`);
console.log(`Expected Length: ~30 characters`);
console.log(`Actual Length: ${testOrderId.length} characters`);

// Compare with old formats
console.log('');
console.log('=== Format Comparison ===');
console.log('Old Format:     ORD1704067200000123        (~20 chars)');
console.log('Enhanced Format: ORD175395539676317422902fb09ca924aaf (~40 chars)');
console.log('HDFC-Compatible: ORD1753955396763123a1b2c3d4        (~30 chars)');

console.log('');
console.log('✅ HDFC-compatible format should work better with HDFC SmartGateway!'); 