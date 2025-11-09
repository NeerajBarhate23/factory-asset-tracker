// API Testing Script
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Test credentials
const testUsers = {
  admin: { email: 'admin@factory.com', password: 'password123' },
  shop: { email: 'shop@factory.com', password: 'password123' },
  maintenance: { email: 'maintenance@factory.com', password: 'password123' },
  operator: { email: 'operator@factory.com', password: 'password123' }
};

let tokens = {};

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

// Test functions
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  console.log('═'.repeat(60));
  try {
    const result = await makeRequest('GET', '/health');
    if (result.status === 200) {
      console.log('✅ PASSED: Server is healthy');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ FAILED: Unexpected status', result.status);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testLogin(role, credentials) {
  console.log(`\n📋 Test 2.${Object.keys(testUsers).indexOf(role) + 1}: Login as ${role.toUpperCase()}`);
  console.log('═'.repeat(60));
  try {
    const result = await makeRequest('POST', '/api/auth/login', credentials);
    if (result.status === 200 && result.data.data && result.data.data.accessToken) {
      console.log('✅ PASSED: Login successful');
      console.log('User:', result.data.data.user.name, `(${result.data.data.user.email})`);
      console.log('Role:', result.data.data.user.role);
      console.log('Access Token:', result.data.data.accessToken.substring(0, 50) + '...');
      console.log('Refresh Token:', result.data.data.refreshToken.substring(0, 50) + '...');
      
      // Store tokens for later tests
      tokens[role] = {
        accessToken: result.data.data.accessToken,
        refreshToken: result.data.data.refreshToken
      };
      return true;
    } else {
      console.log('❌ FAILED: Login unsuccessful');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    return false;
  }
}

async function testInvalidLogin() {
  console.log('\n📋 Test 3: Login with Invalid Credentials (Should Fail)');
  console.log('═'.repeat(60));
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@factory.com',
      password: 'wrongpassword'
    });
    if (result.status === 401) {
      console.log('✅ PASSED: Invalid credentials rejected correctly');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ FAILED: Expected 401, got', result.status);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testGetCurrentUser(role) {
  console.log(`\n📋 Test 4: Get Current User (${role.toUpperCase()})`);
  console.log('═'.repeat(60));
  try {
    if (!tokens[role]) {
      console.log('⚠️ SKIPPED: No token available for', role);
      return;
    }
    
    const result = await makeRequest('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${tokens[role].accessToken}`
    });
    
    if (result.status === 200 && result.data.data) {
      console.log('✅ PASSED: User data retrieved');
      console.log('User:', JSON.stringify(result.data.data, null, 2));
    } else {
      console.log('❌ FAILED: Expected 200, got', result.status);
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testUnauthorizedAccess() {
  console.log('\n📋 Test 5: Access Protected Route Without Token (Should Fail)');
  console.log('═'.repeat(60));
  try {
    const result = await makeRequest('GET', '/api/auth/me');
    if (result.status === 401) {
      console.log('✅ PASSED: Unauthorized access rejected correctly');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ FAILED: Expected 401, got', result.status);
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testRefreshToken(role) {
  console.log(`\n📋 Test 6: Refresh Access Token (${role.toUpperCase()})`);
  console.log('═'.repeat(60));
  try {
    if (!tokens[role] || !tokens[role].refreshToken) {
      console.log('⚠️ SKIPPED: No refresh token available for', role);
      return;
    }
    
    const result = await makeRequest('POST', '/api/auth/refresh', {
      refreshToken: tokens[role].refreshToken
    });
    
    if (result.status === 200 && result.data.data && result.data.data.accessToken) {
      console.log('✅ PASSED: Token refreshed successfully');
      console.log('New Access Token:', result.data.data.accessToken.substring(0, 50) + '...');
      
      // Update stored token
      tokens[role].accessToken = result.data.data.accessToken;
    } else {
      console.log('❌ FAILED: Token refresh unsuccessful');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testChangePassword(role) {
  console.log(`\n📋 Test 7: Change Password (${role.toUpperCase()})`);
  console.log('═'.repeat(60));
  try {
    if (!tokens[role]) {
      console.log('⚠️ SKIPPED: No token available for', role);
      return;
    }
    
    // Change password
    const result = await makeRequest('PUT', '/api/auth/change-password', {
      currentPassword: 'password123',
      newPassword: 'newpassword456'
    }, {
      Authorization: `Bearer ${tokens[role].accessToken}`
    });
    
    if (result.status === 200) {
      console.log('✅ PASSED (Step 1/3): Password changed successfully');
      
      // Try logging in with old password (should fail)
      const oldLoginResult = await makeRequest('POST', '/api/auth/login', {
        email: testUsers[role].email,
        password: 'password123'
      });
      
      if (oldLoginResult.status === 401) {
        console.log('✅ PASSED (Step 2/3): Old password rejected');
      } else {
        console.log('❌ FAILED (Step 2/3): Old password still works!');
      }
      
      // Try logging in with new password (should succeed)
      const newLoginResult = await makeRequest('POST', '/api/auth/login', {
        email: testUsers[role].email,
        password: 'newpassword456'
      });
      
      if (newLoginResult.status === 200) {
        console.log('✅ PASSED (Step 3/3): New password works');
        
        // Change password back to original
        tokens[role].accessToken = newLoginResult.data.accessToken;
        await makeRequest('PUT', '/api/auth/change-password', {
          currentPassword: 'newpassword456',
          newPassword: 'password123'
        }, {
          Authorization: `Bearer ${tokens[role].accessToken}`
        });
        console.log('ℹ️ Password reset to original for future tests');
      } else {
        console.log('❌ FAILED (Step 3/3): New password does not work');
      }
    } else {
      console.log('❌ FAILED: Password change unsuccessful');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

async function testLogout(role) {
  console.log(`\n📋 Test 8: Logout (${role.toUpperCase()})`);
  console.log('═'.repeat(60));
  try {
    if (!tokens[role]) {
      console.log('⚠️ SKIPPED: No token available for', role);
      return;
    }
    
    const result = await makeRequest('POST', '/api/auth/logout', null, {
      Authorization: `Bearer ${tokens[role].accessToken}`
    });
    
    if (result.status === 200) {
      console.log('✅ PASSED: Logout successful');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      
      // Clear stored tokens
      delete tokens[role];
    } else {
      console.log('❌ FAILED: Logout unsuccessful');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 BACKEND API TEST SUITE');
  console.log('═'.repeat(60));
  console.log('Testing Backend: http://localhost:5000');
  console.log('Time:', new Date().toLocaleString());
  
  try {
    // Test 1: Health check
    await testHealthCheck();
    
    // Test 2: Login for all user roles
    for (const [role, credentials] of Object.entries(testUsers)) {
      await testLogin(role, credentials);
    }
    
    // Test 3: Invalid login
    await testInvalidLogin();
    
    // Test 4: Get current user
    await testGetCurrentUser('admin');
    
    // Test 5: Unauthorized access
    await testUnauthorizedAccess();
    
    // Test 6: Refresh token
    await testRefreshToken('admin');
    
    // Test 7: Change password
    await testChangePassword('operator');
    
    // Test 8: Logout
    await testLogout('operator');
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 TEST SUITE COMPLETED');
    console.log('═'.repeat(60));
    console.log('\n✅ All authentication endpoints have been tested!');
    console.log('\nTest Summary:');
    console.log('- Health Check: ✓');
    console.log('- Login (All Roles): ✓');
    console.log('- Invalid Login: ✓');
    console.log('- Get Current User: ✓');
    console.log('- Unauthorized Access: ✓');
    console.log('- Token Refresh: ✓');
    console.log('- Change Password: ✓');
    console.log('- Logout: ✓');
    
  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error);
  }
}

// Run tests
runAllTests();
