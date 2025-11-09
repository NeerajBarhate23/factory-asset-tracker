// Test script for Movements API
const baseURL = 'http://127.0.0.1:5000/api';

let accessToken = '';
let testAssetId = '';
let testMovementId = '';

// Helper function to make HTTP requests
async function request(method, endpoint, data = null, token = null) {
  const url = `${baseURL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function test1_Login() {
  console.log('\n1️⃣  Testing Login...');
  const result = await request('POST', '/auth/login', {
    email: 'admin@factory.com',
    password: 'password123',
  });

  if (result.status === 200 && result.data.data?.accessToken) {
    accessToken = result.data.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed:', result.data.message || result.error);
    return false;
  }
}

async function test2_GetFirstAsset() {
  console.log('\n2️⃣  Getting Test Asset...');
  const result = await request('GET', '/assets?limit=1', null, accessToken);

  if (result.status === 200 && result.data.data?.assets?.length > 0) {
    testAssetId = result.data.data.assets[0].id;
    console.log('✅ Got test asset');
    console.log(`   Asset ID: ${testAssetId}`);
    console.log(`   Asset UID: ${result.data.data.assets[0].assetUid}`);
    return true;
  } else {
    console.log('❌ Failed to get asset:', result.data.message || result.error);
    return false;
  }
}

async function test3_CreateMovementRequest() {
  console.log('\n3️⃣  Testing Create Movement Request...');
  const movementData = {
    assetId: testAssetId,
    fromLocation: 'Shop Floor A - Section 1',
    toLocation: 'Shop Floor B - Section 3',
    reason: 'Asset required for urgent production work',
    notes: 'Handle with care - high criticality machine',
    slaHours: 24
  };

  const result = await request('POST', '/movements', movementData, accessToken);

  if (result.status === 201 && result.data.data?.id) {
    testMovementId = result.data.data.id;
    console.log('✅ Movement request created successfully');
    console.log(`   Movement ID: ${testMovementId}`);
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   From: ${result.data.data.fromLocation}`);
    console.log(`   To: ${result.data.data.toLocation}`);
    console.log(`   SLA Status: ${result.data.data.sla.slaStatus}`);
    console.log(`   SLA Hours Remaining: ${result.data.data.sla.remainingHours}`);
    return true;
  } else {
    console.log('❌ Create movement failed:', result.data.message || result.error);
    return false;
  }
}

async function test4_GetAllMovements() {
  console.log('\n4️⃣  Testing Get All Movements...');
  const result = await request('GET', '/movements?page=1&limit=10', null, accessToken);

  if (result.status === 200 && result.data.data?.movements) {
    console.log('✅ Get all movements successful');
    console.log(`   Total movements: ${result.data.data.pagination.total}`);
    console.log(`   Movements on page: ${result.data.data.movements.length}`);
    if (result.data.data.movements.length > 0) {
      console.log(`   First movement SLA: ${result.data.data.movements[0].sla.slaStatus}`);
    }
    return true;
  } else {
    console.log('❌ Get all movements failed:', result.data.message || result.error);
    return false;
  }
}

async function test5_GetMovementById() {
  console.log('\n5️⃣  Testing Get Movement by ID...');
  const result = await request('GET', `/movements/${testMovementId}`, null, accessToken);

  if (result.status === 200 && result.data.data?.id) {
    console.log('✅ Get movement by ID successful');
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Asset: ${result.data.data.asset.assetUid}`);
    console.log(`   SLA Status: ${result.data.data.sla.slaStatus}`);
    console.log(`   Percent Elapsed: ${result.data.data.sla.percentElapsed}%`);
    return true;
  } else {
    console.log('❌ Get movement by ID failed:', result.data.message || result.error);
    return false;
  }
}

async function test6_GetPendingMovements() {
  console.log('\n6️⃣  Testing Get Pending Movements...');
  const result = await request('GET', '/movements/pending', null, accessToken);

  if (result.status === 200 && Array.isArray(result.data.data)) {
    console.log('✅ Get pending movements successful');
    console.log(`   Pending count: ${result.data.data.length}`);
    return true;
  } else {
    console.log('❌ Get pending movements failed:', result.data.message || result.error);
    return false;
  }
}

async function test7_GetMovementStats() {
  console.log('\n7️⃣  Testing Get Movement Statistics...');
  const result = await request('GET', '/movements/stats', null, accessToken);

  if (result.status === 200 && result.data.data) {
    console.log('✅ Get movement stats successful');
    console.log(`   Total movements: ${result.data.data.total}`);
    console.log(`   By status:`, result.data.data.byStatus);
    console.log(`   Pending: ${result.data.data.pending}`);
    console.log(`   SLA Metrics:`, result.data.data.slaMetrics);
    return true;
  } else {
    console.log('❌ Get movement stats failed:', result.data.message || result.error);
    return false;
  }
}

async function test8_ApproveMovement() {
  console.log('\n8️⃣  Testing Approve Movement...');
  const result = await request('PUT', `/movements/${testMovementId}/approve`, null, accessToken);

  if (result.status === 200 && result.data.data?.status === 'APPROVED') {
    console.log('✅ Movement approved successfully');
    console.log(`   New status: ${result.data.data.status}`);
    console.log(`   Approval date: ${result.data.data.approvalDate}`);
    console.log(`   SLA Status: ${result.data.data.sla.slaStatus}`);
    return true;
  } else {
    console.log('❌ Approve movement failed:', result.data.message || result.error);
    return false;
  }
}

async function test9_DispatchMovement() {
  console.log('\n9️⃣  Testing Dispatch Movement...');
  const result = await request('PUT', `/movements/${testMovementId}/dispatch`, null, accessToken);

  if (result.status === 200 && result.data.data?.status === 'IN_TRANSIT') {
    console.log('✅ Movement dispatched successfully');
    console.log(`   New status: ${result.data.data.status}`);
    console.log(`   Dispatched at: ${result.data.data.dispatchedAt}`);
    console.log(`   SLA Status: ${result.data.data.sla.slaStatus}`);
    return true;
  } else {
    console.log('❌ Dispatch movement failed:', result.data.message || result.error);
    return false;
  }
}

async function test10_CompleteMovement() {
  console.log('\n🔟 Testing Complete Movement...');
  const result = await request('PUT', `/movements/${testMovementId}/complete`, null, accessToken);

  if (result.status === 200 && result.data.data?.status === 'COMPLETED') {
    console.log('✅ Movement completed successfully');
    console.log(`   New status: ${result.data.data.status}`);
    console.log(`   Received at: ${result.data.data.receivedAt}`);
    console.log(`   Final SLA Status: ${result.data.data.sla.slaStatus}`);
    console.log(`   Total time: ${result.data.data.sla.elapsedHours} hours`);
    return true;
  } else {
    console.log('❌ Complete movement failed:', result.data.message || result.error);
    return false;
  }
}

async function test11_GetOverdueMovements() {
  console.log('\n1️⃣1️⃣  Testing Get Overdue Movements...');
  const result = await request('GET', '/movements/overdue', null, accessToken);

  if (result.status === 200 && Array.isArray(result.data.data)) {
    console.log('✅ Get overdue movements successful');
    console.log(`   Overdue/At-risk count: ${result.data.data.length}`);
    return true;
  } else {
    console.log('❌ Get overdue movements failed:', result.data.message || result.error);
    return false;
  }
}

async function test12_FilterMovementsByStatus() {
  console.log('\n1️⃣2️⃣  Testing Filter Movements by Status...');
  const result = await request('GET', '/movements?status=COMPLETED', null, accessToken);

  if (result.status === 200 && result.data.data?.movements) {
    console.log('✅ Filter movements successful');
    console.log(`   Completed movements found: ${result.data.data.movements.length}`);
    return true;
  } else {
    console.log('❌ Filter movements failed:', result.data.message || result.error);
    return false;
  }
}

async function test13_CreateAndRejectMovement() {
  console.log('\n1️⃣3️⃣  Testing Create and Reject Movement...');
  
  // Create a new movement
  const movementData = {
    assetId: testAssetId,
    fromLocation: 'Test Location A',
    toLocation: 'Test Location B',
    reason: 'Test movement for rejection',
    slaHours: 12
  };

  const createResult = await request('POST', '/movements', movementData, accessToken);
  
  if (createResult.status !== 201) {
    console.log('❌ Failed to create test movement');
    return false;
  }

  const newMovementId = createResult.data.data.id;
  
  // Reject the movement
  const rejectResult = await request(
    'PUT',
    `/movements/${newMovementId}/reject`,
    { reason: 'Test rejection - asset not available' },
    accessToken
  );

  if (rejectResult.status === 200 && rejectResult.data.data?.status === 'REJECTED') {
    console.log('✅ Movement rejected successfully');
    console.log(`   Status: ${rejectResult.data.data.status}`);
    return true;
  } else {
    console.log('❌ Reject movement failed:', rejectResult.data.message || rejectResult.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Movements API Tests...');
  console.log('=====================================');

  const tests = [
    test1_Login,
    test2_GetFirstAsset,
    test3_CreateMovementRequest,
    test4_GetAllMovements,
    test5_GetMovementById,
    test6_GetPendingMovements,
    test7_GetMovementStats,
    test8_ApproveMovement,
    test9_DispatchMovement,
    test10_CompleteMovement,
    test11_GetOverdueMovements,
    test12_FilterMovementsByStatus,
    test13_CreateAndRejectMovement
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}/${tests.length}`);
  console.log(`   ❌ Failed: ${failed}/${tests.length}`);
  console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('=====================================\n');
}

// Run tests
runAllTests().catch(console.error);
