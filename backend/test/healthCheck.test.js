/**
 * Simple automated smoke tests for backend health check and routes.
 * Run using: node test/healthCheck.test.js
 */

const http = require('http');
const app = require('../src/app');

const TEST_PORT = 8089;
let server;

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              rawBody: body,
            });
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Starting automated smoke test suite...');
  server = app.listen(TEST_PORT);

  let passed = 0;
  let failed = 0;

  try {
    // 1. Test 404 handler
    console.log('Test 1: Non-existent route returns 404...');
    const res404 = await makeRequest('/api/non-existent-route');
    if (res404.statusCode === 404 && res404.data.code === 'NOT_FOUND') {
      console.log('  PASS: Received structured 404 response.');
      passed++;
    } else {
      console.error('  FAIL: Expected 404, got', res404.statusCode);
      failed++;
    }

    // 2. Test Health check route structure
    console.log('Test 2: Health check endpoint responds...');
    const resHealth = await makeRequest('/api/health');
    if (resHealth.statusCode === 200 || resHealth.statusCode === 503) {
      if (resHealth.data && 'system' in resHealth.data && 'message' in resHealth.data) {
        console.log(`  PASS: Health check responded with valid status (${resHealth.statusCode}) and structured JSON.`);
        passed++;
      } else {
        console.error('  FAIL: Health check response missing expected schema fields:', resHealth.data);
        failed++;
      }
    } else {
      console.error('  FAIL: Unexpected status code from health check:', resHealth.statusCode);
      failed++;
    }

    console.log('\n================================================================');
    console.log(`Test Results: ${passed} passed, ${failed} failed.`);
    console.log('================================================================');
  } catch (error) {
    console.error('Test runner encountered an error:', error);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

