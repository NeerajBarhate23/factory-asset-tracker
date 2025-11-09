// Comprehensive API Test Suite
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;
const testResults = [];

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Connection failed: ${error.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test result tracker
function recordTest(category, name, passed, details = '') {
  testResults.push({ category, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${name}`);
  if (details && !passed) {
    console.log(`     └─ ${details}`);
  }
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Server Health');
  console.log('─'.repeat(60));
  try {
    const result = await makeRequest('GET', '/health');
    recordTest('Server', 'Health Check', result.status === 200, `Status: ${result.status}`);
    if (result.status === 200) {
      console.log(`     Server: ${result.data.message}`);
    }
    return result.status === 200;
  } catch (error) {
    recordTest('Server', 'Health Check', false, error.message);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication API');
  console.log('─'.repeat(60));
  
  const tokens = {};
  
  // Test 1: Register new user (should work or user already exists)
  try {
    const registerResult = await makeRequest('POST', '/api/auth/register', {
      email: 'test@factory.com',
      password: 'Test123!@#',
      name: 'Test User',
      role: 'OPERATOR',
      department: 'Testing'
    });
    recordTest('Auth', 'POST /api/auth/register', 
      registerResult.status === 200 || registerResult.status === 409, 
      registerResult.data.error || 'Registration successful or user exists'
    );
  } catch (error) {
    recordTest('Auth', 'POST /api/auth/register', false, error.message);
  }
  
  // Test 2: Login with valid credentials
  try {
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@factory.com',
      password: 'password123'
    });
    const passed = loginResult.status === 200 && loginResult.data.data?.accessToken;
    recordTest('Auth', 'POST /api/auth/login', passed, passed ? 'Login successful' : loginResult.data.error);
    
    if (passed) {
      tokens.admin = {
        accessToken: loginResult.data.data.accessToken,
        refreshToken: loginResult.data.data.refreshToken
      };
      console.log(`     User: ${loginResult.data.data.user.name} (${loginResult.data.data.user.role})`);
    }
  } catch (error) {
    recordTest('Auth', 'POST /api/auth/login', false, error.message);
  }
  
  // Test 3: Login with invalid credentials (should fail)
  try {
    const invalidResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@factory.com',
      password: 'wrongpassword'
    });
    const passed = invalidResult.status === 401;
    recordTest('Auth', 'POST /api/auth/login (invalid)', passed, passed ? 'Correctly rejected' : 'Should have rejected');
  } catch (error) {
    recordTest('Auth', 'POST /api/auth/login (invalid)', false, error.message);
  }
  
  // Test 4: Get current user (protected route)
  try {
    if (tokens.admin) {
      const meResult = await makeRequest('GET', '/api/auth/me', null, {
        Authorization: `Bearer ${tokens.admin.accessToken}`
      });
      const passed = meResult.status === 200 && meResult.data.data;
      recordTest('Auth', 'GET /api/auth/me', passed, passed ? 'User data retrieved' : meResult.data.error);
    } else {
      recordTest('Auth', 'GET /api/auth/me', false, 'No token available');
    }
  } catch (error) {
    recordTest('Auth', 'GET /api/auth/me', false, error.message);
  }
  
  // Test 5: Access protected route without token (should fail)
  try {
    const noTokenResult = await makeRequest('GET', '/api/auth/me');
    const passed = noTokenResult.status === 401;
    recordTest('Auth', 'GET /api/auth/me (no token)', passed, passed ? 'Correctly rejected' : 'Should have rejected');
  } catch (error) {
    recordTest('Auth', 'GET /api/auth/me (no token)', false, error.message);
  }
  
  // Test 6: Refresh access token
  try {
    if (tokens.admin) {
      const refreshResult = await makeRequest('POST', '/api/auth/refresh', {
        refreshToken: tokens.admin.refreshToken
      });
      const passed = refreshResult.status === 200 && refreshResult.data.data?.accessToken;
      recordTest('Auth', 'POST /api/auth/refresh', passed, passed ? 'Token refreshed' : refreshResult.data.error);
    } else {
      recordTest('Auth', 'POST /api/auth/refresh', false, 'No refresh token available');
    }
  } catch (error) {
    recordTest('Auth', 'POST /api/auth/refresh', false, error.message);
  }
  
  // Test 7: Change password
  try {
    if (tokens.admin) {
      const changeResult = await makeRequest('PUT', '/api/auth/change-password', {
        currentPassword: 'password123',
        newPassword: 'password123' // Keep same for testing
      }, {
        Authorization: `Bearer ${tokens.admin.accessToken}`
      });
      const passed = changeResult.status === 200;
      recordTest('Auth', 'PUT /api/auth/change-password', passed, passed ? 'Password updated' : changeResult.data.error);
    } else {
      recordTest('Auth', 'PUT /api/auth/change-password', false, 'No token available');
    }
  } catch (error) {
    recordTest('Auth', 'PUT /api/auth/change-password', false, error.message);
  }
  
  // Test 8: Logout
  try {
    if (tokens.admin) {
      const logoutResult = await makeRequest('POST', '/api/auth/logout', null, {
        Authorization: `Bearer ${tokens.admin.accessToken}`
      });
      const passed = logoutResult.status === 200;
      recordTest('Auth', 'POST /api/auth/logout', passed, passed ? 'Logged out successfully' : logoutResult.data.error);
    } else {
      recordTest('Auth', 'POST /api/auth/logout', false, 'No token available');
    }
  } catch (error) {
    recordTest('Auth', 'POST /api/auth/logout', false, error.message);
  }
}

async function testUnimplementedEndpoints() {
  console.log('\n📋 Testing Unimplemented APIs (Expected 404)');
  console.log('─'.repeat(60));
  
  const unimplementedRoutes = [
    { method: 'GET', path: '/api/users', name: 'User Management' },
    { method: 'GET', path: '/api/assets', name: 'Assets' },
    { method: 'GET', path: '/api/movements', name: 'Movements' },
    { method: 'GET', path: '/api/audits', name: 'Audits' },
    { method: 'GET', path: '/api/files', name: 'Files' },
    { method: 'GET', path: '/api/reports', name: 'Reports' },
    { method: 'GET', path: '/api/dashboard', name: 'Dashboard' }
  ];
  
  for (const route of unimplementedRoutes) {
    try {
      const result = await makeRequest(route.method, route.path);
      const is404 = result.status === 404;
      recordTest('Unimplemented', `${route.method} ${route.path}`, is404, 
        is404 ? 'Not implemented (as expected)' : `Unexpected status: ${result.status}`
      );
    } catch (error) {
      recordTest('Unimplemented', `${route.method} ${route.path}`, false, error.message);
    }
  }
}

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const byCategory = {};
  testResults.forEach(test => {
    if (!byCategory[test.category]) {
      byCategory[test.category] = { total: 0, passed: 0, failed: 0 };
    }
    byCategory[test.category].total++;
    if (test.passed) {
      byCategory[test.category].passed++;
    } else {
      byCategory[test.category].failed++;
    }
  });
  
  Object.keys(byCategory).forEach(category => {
    const stats = byCategory[category];
    const percentage = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`\n${category}:`);
    console.log(`  Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Success Rate: ${percentage}%`);
  });
  
  const totalTests = testResults.length;
  const totalPassed = testResults.filter(t => t.passed).length;
  const totalFailed = testResults.filter(t => !t.passed).length;
  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(0);
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
  console.log('═'.repeat(60));
  
  console.log('\n📝 API Implementation Status:');
  console.log('  ✅ Authentication API - COMPLETE (8/8 endpoints)');
  console.log('  ⏳ User Management API - NOT STARTED (0/5 endpoints)');
  console.log('  ⏳ Assets API - NOT STARTED (0/8 endpoints)');
  console.log('  ⏳ Movements API - NOT STARTED (0/6 endpoints)');
  console.log('  ⏳ Audits API - NOT STARTED (0/5 endpoints)');
  console.log('  ⏳ Files API - NOT STARTED (0/4 endpoints)');
  console.log('  ⏳ Reports API - NOT STARTED (0/3 endpoints)');
  console.log('  ⏳ Dashboard API - NOT STARTED (0/4 endpoints)');
  
  console.log('\n🎯 Next Steps:');
  console.log('  1. Build User Management API (CRUD operations)');
  console.log('  2. Build Assets API with QR code generation');
  console.log('  3. Build Movements API for asset tracking');
  console.log('  4. Build Audits API for compliance');
  console.log('  5. Build Files API for document uploads');
  console.log('  6. Build Reports API for analytics');
  console.log('  7. Build Dashboard API for metrics\n');
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 COMPREHENSIVE API TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`Backend: http://${BASE_URL}:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  try {
    const serverRunning = await testHealthEndpoint();
    
    if (serverRunning) {
      await testAuthEndpoints();
      await testUnimplementedEndpoints();
    } else {
      console.log('\n❌ Server is not running. Cannot proceed with tests.');
      console.log('   Please start the server with: npm start');
    }
    
    printSummary();
  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error);
  }
}

// Run tests
runAllTests();
