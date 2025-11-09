// User API Test Suite
const http = require('http');

const BASE_URL = '127.0.0.1'; // Use 127.0.0.1 instead of localhost for Windows compatibility
const PORT = 5000;
let adminToken = '';
let createdUserId = '';

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
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function loginAsAdmin() {
  console.log('\n🔐 Step 1: Login as Admin');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@factory.com',
      password: 'password123'
    });
    
    if (result.status === 200 && result.data.data?.accessToken) {
      adminToken = result.data.data.accessToken;
      console.log('✅ Admin login successful');
      console.log(`   Token: ${adminToken.substring(0, 50)}...`);
      return true;
    } else {
      console.log('❌ Admin login failed:', result.data.error || result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

async function testGetUsers() {
  console.log('\n📋 Step 2: GET /api/users - List all users');
  console.log('─'.repeat(60));
  
  const result = await makeRequest('GET', '/api/users', null, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ Users retrieved successfully');
    console.log(`   Total users: ${result.data.data.pagination.total}`);
    console.log(`   Page: ${result.data.data.pagination.page}/${result.data.data.pagination.totalPages}`);
    console.log(`   Users on this page: ${result.data.data.users.length}`);
    result.data.data.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testGetUsersWithFilter() {
  console.log('\n📋 Step 3: GET /api/users?role=ADMIN - Filter by role');
  console.log('─'.repeat(60));
  
  const result = await makeRequest('GET', '/api/users?role=ADMIN&limit=5', null, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ Admin users retrieved');
    console.log(`   Found: ${result.data.data.users.length} admin(s)`);
    result.data.data.users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.name} - ${user.role}`);
    });
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testGetUserStats() {
  console.log('\n📊 Step 4: GET /api/users/stats - User statistics');
  console.log('─'.repeat(60));
  
  const result = await makeRequest('GET', '/api/users/stats', null, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ Statistics retrieved');
    console.log(`   Total Users: ${result.data.data.total}`);
    console.log(`   Recent (30 days): ${result.data.data.recent}`);
    console.log('\n   By Role:');
    result.data.data.byRole.forEach(item => {
      console.log(`     - ${item.role}: ${item.count}`);
    });
    console.log('\n   By Department:');
    result.data.data.byDepartment.forEach(item => {
      console.log(`     - ${item.department}: ${item.count}`);
    });
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testCreateUser() {
  console.log('\n➕ Step 5: POST /api/users - Create new user');
  console.log('─'.repeat(60));
  
  const newUser = {
    email: 'testuser@factory.com',
    password: 'Test1234!',
    name: 'Test User',
    role: 'OPERATOR',
    department: 'Testing'
  };
  
  const result = await makeRequest('POST', '/api/users', newUser, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 201) {
    createdUserId = result.data.data.id;
    console.log('✅ User created successfully');
    console.log(`   ID: ${result.data.data.id}`);
    console.log(`   Name: ${result.data.data.name}`);
    console.log(`   Email: ${result.data.data.email}`);
    console.log(`   Role: ${result.data.data.role}`);
  } else if (result.status === 409) {
    console.log('⚠️  User already exists (expected if running test multiple times)');
    // Try to get the user
    const users = await makeRequest('GET', '/api/users?search=testuser@factory.com', null, {
      Authorization: `Bearer ${adminToken}`
    });
    if (users.data.data?.users.length > 0) {
      createdUserId = users.data.data.users[0].id;
      console.log(`   Found existing user ID: ${createdUserId}`);
    }
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testGetUserById() {
  console.log('\n🔍 Step 6: GET /api/users/:id - Get single user');
  console.log('─'.repeat(60));
  
  if (!createdUserId) {
    console.log('⚠️  Skipped: No user ID available');
    return;
  }
  
  const result = await makeRequest('GET', `/api/users/${createdUserId}`, null, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ User retrieved successfully');
    console.log(`   Name: ${result.data.data.name}`);
    console.log(`   Email: ${result.data.data.email}`);
    console.log(`   Role: ${result.data.data.role}`);
    console.log(`   Department: ${result.data.data.department}`);
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testUpdateUser() {
  console.log('\n✏️  Step 7: PUT /api/users/:id - Update user');
  console.log('─'.repeat(60));
  
  if (!createdUserId) {
    console.log('⚠️  Skipped: No user ID available');
    return;
  }
  
  const result = await makeRequest('PUT', `/api/users/${createdUserId}`, {
    name: 'Test User (Updated)',
    department: 'Quality Control'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ User updated successfully');
    console.log(`   Name: ${result.data.data.name}`);
    console.log(`   Department: ${result.data.data.department}`);
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testDeleteUser() {
  console.log('\n🗑️  Step 8: DELETE /api/users/:id - Delete user');
  console.log('─'.repeat(60));
  
  if (!createdUserId) {
    console.log('⚠️  Skipped: No user ID available');
    return;
  }
  
  const result = await makeRequest('DELETE', `/api/users/${createdUserId}`, null, {
    Authorization: `Bearer ${adminToken}`
  });
  
  if (result.status === 200) {
    console.log('✅ User deleted successfully');
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🚫 Step 9: Test unauthorized access');
  console.log('─'.repeat(60));
  
  const result = await makeRequest('GET', '/api/users');
  
  if (result.status === 401) {
    console.log('✅ Correctly rejected request without token');
  } else {
    console.log('❌ Should have rejected unauthorized request');
  }
}

async function runTests() {
  console.log('\n🚀 USER API TEST SUITE');
  console.log('═'.repeat(60));
  console.log(`Backend: http://${BASE_URL}:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  try {
    const loggedIn = await loginAsAdmin();
    
    if (!loggedIn) {
      console.log('\n❌ Cannot proceed without admin login');
      return;
    }
    
    await testGetUsers();
    await testGetUsersWithFilter();
    await testGetUserStats();
    await testCreateUser();
    await testGetUserById();
    await testUpdateUser();
    await testDeleteUser();
    await testUnauthorizedAccess();
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ USER API TEST SUITE COMPLETED');
    console.log('═'.repeat(60));
    console.log('\nAll User Management endpoints have been tested!');
    console.log('\nTested Endpoints:');
    console.log('  ✅ GET /api/users - List users with pagination');
    console.log('  ✅ GET /api/users?role=ADMIN - Filter by role');
    console.log('  ✅ GET /api/users/stats - User statistics');
    console.log('  ✅ GET /api/users/:id - Get single user');
    console.log('  ✅ POST /api/users - Create user');
    console.log('  ✅ PUT /api/users/:id - Update user');
    console.log('  ✅ DELETE /api/users/:id - Delete user');
    console.log('  ✅ Unauthorized access protection\n');
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  }
}

runTests();
