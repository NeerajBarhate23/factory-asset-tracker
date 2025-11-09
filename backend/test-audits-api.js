// Test script for Audits API
const baseURL = 'http://127.0.0.1:5000/api';

let accessToken = '';
let testAssetId = '';
let testAuditId = '';

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

async function test3_ScheduleAudit() {
  console.log('\n3️⃣  Testing Schedule Audit...');
  
  // Schedule audit for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const auditData = {
    location: 'Shop Floor A',
    category: 'CNC_MACHINE',
    scheduledDate: tomorrow.toISOString(),
    totalAssets: 20,
    notes: 'Quarterly audit of CNC machines in Shop Floor A'
  };

  const result = await request('POST', '/audits', auditData, accessToken);

  if (result.status === 201 && result.data.data?.id) {
    testAuditId = result.data.data.id;
    console.log('✅ Audit scheduled successfully');
    console.log(`   Audit ID: ${testAuditId}`);
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Location: ${result.data.data.location}`);
    console.log(`   Scheduled: ${result.data.data.scheduledDate}`);
    return true;
  } else {
    console.log('❌ Schedule audit failed:', result.data.message || result.error);
    return false;
  }
}

async function test4_GetAllAudits() {
  console.log('\n4️⃣  Testing Get All Audits...');
  const result = await request('GET', '/audits?page=1&limit=10', null, accessToken);

  if (result.status === 200 && result.data.data?.audits) {
    console.log('✅ Get all audits successful');
    console.log(`   Total audits: ${result.data.data.pagination.total}`);
    console.log(`   Audits on page: ${result.data.data.audits.length}`);
    if (result.data.data.audits.length > 0) {
      console.log(`   First audit completion: ${result.data.data.audits[0].completionPercentage}%`);
    }
    return true;
  } else {
    console.log('❌ Get all audits failed:', result.data.message || result.error);
    return false;
  }
}

async function test5_GetAuditById() {
  console.log('\n5️⃣  Testing Get Audit by ID...');
  const result = await request('GET', `/audits/${testAuditId}`, null, accessToken);

  if (result.status === 200 && result.data.data?.id) {
    console.log('✅ Get audit by ID successful');
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Location: ${result.data.data.location}`);
    console.log(`   Total Assets: ${result.data.data.totalAssets}`);
    console.log(`   Completion: ${result.data.data.completionPercentage}%`);
    return true;
  } else {
    console.log('❌ Get audit by ID failed:', result.data.message || result.error);
    return false;
  }
}

async function test6_GetScheduledAudits() {
  console.log('\n6️⃣  Testing Get Scheduled Audits...');
  const result = await request('GET', '/audits/scheduled', null, accessToken);

  if (result.status === 200 && Array.isArray(result.data.data)) {
    console.log('✅ Get scheduled audits successful');
    console.log(`   Scheduled count: ${result.data.data.length}`);
    return true;
  } else {
    console.log('❌ Get scheduled audits failed:', result.data.message || result.error);
    return false;
  }
}

async function test7_GetAuditStats() {
  console.log('\n7️⃣  Testing Get Audit Statistics...');
  const result = await request('GET', '/audits/stats', null, accessToken);

  if (result.status === 200 && result.data.data) {
    console.log('✅ Get audit stats successful');
    console.log(`   Total audits: ${result.data.data.total}`);
    console.log(`   By status:`, result.data.data.byStatus);
    console.log(`   Scheduled: ${result.data.data.scheduled}`);
    console.log(`   Total discrepancies: ${result.data.data.totalDiscrepancies}`);
    console.log(`   Completion rate: ${result.data.data.completionRate}%`);
    return true;
  } else {
    console.log('❌ Get audit stats failed:', result.data.message || result.error);
    return false;
  }
}

async function test8_UpdateAudit() {
  console.log('\n8️⃣  Testing Update Audit...');
  const updateData = {
    totalAssets: 25,
    notes: 'Updated audit details - Added 5 more machines'
  };

  const result = await request('PUT', `/audits/${testAuditId}`, updateData, accessToken);

  if (result.status === 200 && result.data.data?.id) {
    console.log('✅ Update audit successful');
    console.log(`   New total assets: ${result.data.data.totalAssets}`);
    console.log(`   Updated notes: ${result.data.data.notes}`);
    return true;
  } else {
    console.log('❌ Update audit failed:', result.data.message || result.error);
    return false;
  }
}

async function test9_StartAudit() {
  console.log('\n9️⃣  Testing Start Audit...');
  const result = await request('PUT', `/audits/${testAuditId}/start`, null, accessToken);

  if (result.status === 200 && result.data.data?.status === 'IN_PROGRESS') {
    console.log('✅ Audit started successfully');
    console.log(`   New status: ${result.data.data.status}`);
    return true;
  } else {
    console.log('❌ Start audit failed:', result.data.message || result.error);
    return false;
  }
}

async function test10_CompleteAudit() {
  console.log('\n🔟 Testing Complete Audit...');
  const completionData = {
    assetsScanned: 23,
    discrepancies: 2,
    notes: 'Found 2 discrepancies: 1 missing asset tag, 1 location mismatch'
  };

  const result = await request('PUT', `/audits/${testAuditId}/complete`, completionData, accessToken);

  if (result.status === 200 && (result.data.data?.status === 'COMPLETED' || result.data.data?.status === 'DISCREPANCY_FOUND')) {
    console.log('✅ Audit completed successfully');
    console.log(`   Final status: ${result.data.data.status}`);
    console.log(`   Assets scanned: ${result.data.data.assetsScanned}/${result.data.data.totalAssets}`);
    console.log(`   Discrepancies: ${result.data.data.discrepancies}`);
    console.log(`   Completion: ${result.data.data.completionPercentage}%`);
    return true;
  } else {
    console.log('❌ Complete audit failed:', result.data.message || result.error);
    return false;
  }
}

async function test11_FilterAuditsByStatus() {
  console.log('\n1️⃣1️⃣  Testing Filter Audits by Status...');
  const result = await request('GET', '/audits?status=DISCREPANCY_FOUND', null, accessToken);

  if (result.status === 200 && result.data.data?.audits) {
    console.log('✅ Filter audits successful');
    console.log(`   Audits with discrepancies: ${result.data.data.audits.length}`);
    return true;
  } else {
    console.log('❌ Filter audits failed:', result.data.message || result.error);
    return false;
  }
}

async function test12_ScheduleSpecificAssetAudit() {
  console.log('\n1️⃣2️⃣  Testing Schedule Specific Asset Audit...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  
  const auditData = {
    assetId: testAssetId,
    scheduledDate: tomorrow.toISOString(),
    totalAssets: 1,
    notes: 'Specific asset inspection'
  };

  const result = await request('POST', '/audits', auditData, accessToken);

  if (result.status === 201 && result.data.data?.id) {
    const specificAuditId = result.data.data.id;
    console.log('✅ Specific asset audit scheduled successfully');
    console.log(`   Asset UID: ${result.data.data.asset?.assetUid}`);
    
    // Delete this test audit
    await request('DELETE', `/audits/${specificAuditId}`, null, accessToken);
    
    return true;
  } else {
    console.log('❌ Schedule specific asset audit failed:', result.data.message || result.error);
    return false;
  }
}

async function test13_DeleteAudit() {
  console.log('\n1️⃣3️⃣  Testing Delete Audit...');
  
  // Create a new audit to delete
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  
  const createResult = await request('POST', '/audits', {
    location: 'Test Location',
    scheduledDate: tomorrow.toISOString(),
    totalAssets: 5
  }, accessToken);
  
  if (createResult.status !== 201) {
    console.log('❌ Failed to create test audit for deletion');
    return false;
  }

  const auditToDelete = createResult.data.data.id;
  
  // Delete the audit
  const result = await request('DELETE', `/audits/${auditToDelete}`, null, accessToken);

  if (result.status === 200) {
    console.log('✅ Audit deleted successfully');
    return true;
  } else {
    console.log('❌ Delete audit failed:', result.data.message || result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Audits API Tests...');
  console.log('=====================================');

  const tests = [
    test1_Login,
    test2_GetFirstAsset,
    test3_ScheduleAudit,
    test4_GetAllAudits,
    test5_GetAuditById,
    test6_GetScheduledAudits,
    test7_GetAuditStats,
    test8_UpdateAudit,
    test9_StartAudit,
    test10_CompleteAudit,
    test11_FilterAuditsByStatus,
    test12_ScheduleSpecificAssetAudit,
    test13_DeleteAudit
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
