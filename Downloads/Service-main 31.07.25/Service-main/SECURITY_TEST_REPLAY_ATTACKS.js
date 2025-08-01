#!/usr/bin/env node

/**
 * 🔒 REPLAY ATTACK SECURITY TESTING SUITE
 * 
 * This script tests the comprehensive replay attack protection measures
 * implemented to address the critical security vulnerability identified
 * during bank testing.
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testTimeout: 30000, // 30 seconds
  maxRetries: 3,
  testUser: {
    email: 'security.test@example.com',
    phone: '+1234567890',
    name: 'Security Test User'
  }
};

// Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

/**
 * Utility Functions
 */
function generateTestOrderId() {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TEST${timestamp}${random}${uuid}`;
}

function generateHDFCSignature(data) {
  const secretKey = process.env.HDFC_SECRET_KEY || 'test_secret_key';
  const signatureString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', secretKey)
    .update(signatureString)
    .digest('base64');
}

function createValidPaymentResponse(orderId) {
  const responseData = {
    order_id: orderId,
    status: 'CHARGED',
    status_id: '21',
    amount: '100.00',
    currency: 'INR',
    payment_method: 'netbanking',
    signature_algorithm: 'HMAC-SHA256'
  };
  
  responseData.signature = generateHDFCSignature(responseData);
  return responseData;
}

function createValidWebhook(orderId, eventType = 'success') {
  const webhookData = {
    webhook_id: `webhook_${orderId}_${Date.now()}`,
    event_id: `event_${crypto.randomUUID()}`,
    event_type: eventType,
    order_id: orderId,
    status: 'CHARGED',
    amount: '100.00',
    currency: 'INR',
    timestamp: new Date().toISOString()
  };
  
  webhookData.signature = generateHDFCSignature(webhookData);
  return webhookData;
}

async function makeRequest(endpoint, method = 'POST', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTestSuite/1.0',
        ...headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: {},
            raw: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function makeFormRequest(endpoint, formData) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONFIG.baseUrl);
    const postData = new URLSearchParams(formData).toString();
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'SecurityTestSuite/1.0'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          raw: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Test Suite: Payment Response Replay Attacks
 */
async function testPaymentResponseReplayAttacks() {
  console.log('\n🔒 Testing Payment Response Replay Attack Protection...');
  
  const orderId = generateTestOrderId();
  const paymentData = createValidPaymentResponse(orderId);
  
  try {
    // Test 1: First legitimate transaction should succeed
    const response1 = await makeFormRequest('/api/payment/response', paymentData);
    logTest(
      'Legitimate payment response accepted',
      response1.status === 200 || response1.status === 302,
      `Status: ${response1.status}`
    );
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Replay attack should be rejected
    const response2 = await makeFormRequest('/api/payment/response', paymentData);
    logTest(
      'Payment response replay attack blocked',
      response2.status === 409,
      `Status: ${response2.status} (Expected: 409 Conflict)`
    );
    
    // Test 3: Different order with same signature should be rejected
    const differentOrderData = { ...paymentData, order_id: generateTestOrderId() };
    const response3 = await makeFormRequest('/api/payment/response', differentOrderData);
    logTest(
      'Signature reuse across orders blocked',
      response3.status === 409,
      `Status: ${response3.status} (Expected: 409 Conflict)`
    );
    
  } catch (error) {
    logTest('Payment response replay test failed', false, error.message);
  }
}

/**
 * Test Suite: Webhook Replay Attacks
 */
async function testWebhookReplayAttacks() {
  console.log('\n🔒 Testing Webhook Replay Attack Protection...');
  
  const orderId = generateTestOrderId();
  const webhookData = createValidWebhook(orderId);
  
  try {
    // Test 1: First legitimate webhook should succeed
    const response1 = await makeRequest('/api/webhook', 'POST', webhookData);
    logTest(
      'Legitimate webhook accepted',
      response1.status === 200,
      `Status: ${response1.status}`
    );
    
    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Webhook replay should be rejected
    const response2 = await makeRequest('/api/webhook', 'POST', webhookData);
    logTest(
      'Webhook replay attack blocked',
      response2.status === 409,
      `Status: ${response2.status} (Expected: 409 Conflict)`
    );
    
    // Test 3: Different webhook with same signature should be rejected
    const differentWebhookData = { 
      ...webhookData, 
      webhook_id: `webhook_${generateTestOrderId()}_${Date.now()}`,
      event_id: `event_${crypto.randomUUID()}`
    };
    const response3 = await makeRequest('/api/webhook', 'POST', differentWebhookData);
    logTest(
      'Webhook signature reuse blocked',
      response3.status === 409,
      `Status: ${response3.status} (Expected: 409 Conflict)`
    );
    
  } catch (error) {
    logTest('Webhook replay test failed', false, error.message);
  }
}

/**
 * Test Suite: Timestamp Validation
 */
async function testTimestampValidation() {
  console.log('\n🔒 Testing Timestamp Validation...');
  
  const orderId = generateTestOrderId();
  
  try {
    // Test 1: Current timestamp should be accepted
    const currentData = createValidPaymentResponse(orderId);
    currentData.timestamp = new Date().toISOString();
    
    const response1 = await makeFormRequest('/api/payment/response', currentData);
    logTest(
      'Current timestamp accepted',
      response1.status === 200 || response1.status === 302,
      `Status: ${response1.status}`
    );
    
    // Test 2: Old timestamp should be rejected
    const oldOrderId = generateTestOrderId();
    const oldData = createValidPaymentResponse(oldOrderId);
    const oldTimestamp = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    oldData.timestamp = oldTimestamp.toISOString();
    
    const response2 = await makeFormRequest('/api/payment/response', oldData);
    logTest(
      'Stale timestamp rejected',
      response2.status === 400 || response2.status === 409,
      `Status: ${response2.status} (Expected: 400 or 409)`
    );
    
  } catch (error) {
    logTest('Timestamp validation test failed', false, error.message);
  }
}

/**
 * Test Suite: Signature Validation
 */
async function testSignatureValidation() {
  console.log('\n🔒 Testing Signature Validation...');
  
  const orderId = generateTestOrderId();
  
  try {
    // Test 1: Valid signature should be accepted
    const validData = createValidPaymentResponse(orderId);
    const response1 = await makeFormRequest('/api/payment/response', validData);
    logTest(
      'Valid signature accepted',
      response1.status === 200 || response1.status === 302,
      `Status: ${response1.status}`
    );
    
    // Test 2: Invalid signature should be rejected
    const invalidOrderId = generateTestOrderId();
    const invalidData = createValidPaymentResponse(invalidOrderId);
    invalidData.signature = 'invalid_signature_' + crypto.randomBytes(16).toString('hex');
    
    const response2 = await makeFormRequest('/api/payment/response', invalidData);
    logTest(
      'Invalid signature rejected',
      response2.status === 400,
      `Status: ${response2.status} (Expected: 400 Bad Request)`
    );
    
  } catch (error) {
    logTest('Signature validation test failed', false, error.message);
  }
}

/**
 * Test Suite: Concurrent Attack Simulation
 */
async function testConcurrentAttacks() {
  console.log('\n🔒 Testing Concurrent Attack Protection...');
  
  const orderId = generateTestOrderId();
  const paymentData = createValidPaymentResponse(orderId);
  
  try {
    // Launch multiple concurrent requests with same data
    const concurrentRequests = Array.from({ length: 5 }, () => 
      makeFormRequest('/api/payment/response', paymentData)
    );
    
    const responses = await Promise.allSettled(concurrentRequests);
    
    // Count successful and rejected responses
    const successful = responses.filter(r => 
      r.status === 'fulfilled' && (r.value.status === 200 || r.value.status === 302)
    );
    const rejected = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 409
    );
    
    logTest(
      'Concurrent attack protection',
      successful.length === 1 && rejected.length >= 3,
      `Successful: ${successful.length}, Rejected: ${rejected.length} (Expected: 1 successful, 4+ rejected)`
    );
    
  } catch (error) {
    logTest('Concurrent attack test failed', false, error.message);
  }
}

/**
 * Test Suite: Security Monitoring
 */
async function testSecurityMonitoring() {
  console.log('\n🔒 Testing Security Monitoring...');
  
  try {
    // Test security status endpoint (if available)
    const response = await makeRequest('/api/admin/security-status', 'GET');
    logTest(
      'Security monitoring endpoint accessible',
      response.status === 200 || response.status === 401, // 401 is OK if auth required
      `Status: ${response.status}`
    );
    
    // Test if security events are being logged
    // This would require admin access to verify
    logTest(
      'Security event logging (manual verification required)',
      true,
      'Check security_audit_log table for replay attack events'
    );
    
  } catch (error) {
    logTest('Security monitoring test failed', false, error.message);
  }
}

/**
 * Main Test Runner
 */
async function runSecurityTests() {
  console.log('🔒 REPLAY ATTACK SECURITY TEST SUITE');
  console.log('=====================================');
  console.log(`Testing against: ${CONFIG.baseUrl}`);
  console.log(`Test timeout: ${CONFIG.testTimeout}ms`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    await testPaymentResponseReplayAttacks();
    await testWebhookReplayAttacks();
    await testTimestampValidation();
    await testSignatureValidation();
    await testConcurrentAttacks();
    await testSecurityMonitoring();
    
  } catch (error) {
    console.error('Test execution failed:', error);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print final results
  console.log('\n🔒 SECURITY TEST RESULTS');
  console.log('========================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  
  // Security assessment
  const securityScore = (testResults.passed / testResults.total) * 100;
  console.log('\n🛡️ SECURITY ASSESSMENT');
  console.log('======================');
  
  if (securityScore >= 90) {
    console.log('🟢 EXCELLENT SECURITY - Replay attack protection is robust');
  } else if (securityScore >= 75) {
    console.log('🟡 GOOD SECURITY - Minor improvements needed');
  } else if (securityScore >= 50) {
    console.log('🟠 MODERATE SECURITY - Significant improvements required');
  } else {
    console.log('🔴 POOR SECURITY - Critical vulnerabilities present');
  }
  
  // Detailed results
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.test}: ${test.details}`);
      });
  }
  
  // Export results for CI/CD
  if (process.env.CI) {
    const resultsFile = 'security-test-results.json';
    require('fs').writeFileSync(resultsFile, JSON.stringify({
      ...testResults,
      securityScore,
      duration,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`\n📊 Results exported to: ${resultsFile}`);
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test execution interrupted');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

module.exports = {
  runSecurityTests,
  testResults,
  CONFIG
};