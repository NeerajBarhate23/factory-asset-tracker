// Test script for Assets API
const baseURL = 'http://127.0.0.1:5000/api';

let accessToken = '';
let testAssetId = '';

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
    console.log(`   Token: ${accessToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed:', result.data.message || result.error);
    return false;
  }
}

async function test2_CreateAsset() {
  console.log('\n2️⃣  Testing Create Asset...');
  const assetData = {
    name: 'CNC Milling Machine XYZ-1000',
    category: 'CNC_MACHINE',
    location: 'Shop Floor A - Section 2',
    criticality: 'HIGH',
    status: 'ACTIVE',
    ownerDepartment: 'Production',
    make: 'Haas',
    model: 'VF-2',
    serialNumber: 'SN123456789',
    purchaseDate: '2023-01-15',
    warrantyExpiry: '2026-01-15',
    specifications: '3-axis vertical machining center, 30" x 16" x 20" travel',
    notes: 'Primary machine for precision parts'
  };

  const result = await request('POST', '/assets', assetData, accessToken);

  if (result.status === 201 && result.data.data?.id) {
    testAssetId = result.data.data.id;
    console.log('✅ Asset created successfully');
    console.log(`   Asset ID: ${testAssetId}`);
    console.log(`   Asset UID: ${result.data.data.assetUid}`);
    console.log(`   Name: ${result.data.data.name}`);
    return true;
  } else {
    console.log('❌ Create asset failed:', result.data.message || result.error);
    return false;
  }
}

async function test3_GetAllAssets() {
  console.log('\n3️⃣  Testing Get All Assets...');
  const result = await request('GET', '/assets?page=1&limit=10', null, accessToken);

  if (result.status === 200 && result.data.data?.assets) {
    console.log('✅ Get all assets successful');
    console.log(`   Total assets: ${result.data.data.pagination.total}`);
    console.log(`   Assets on page: ${result.data.data.assets.length}`);
    return true;
  } else {
    console.log('❌ Get all assets failed:', result.data.message || result.error);
    return false;
  }
}

async function test4_GetAssetById() {
  console.log('\n4️⃣  Testing Get Asset by ID...');
  const result = await request('GET', `/assets/${testAssetId}`, null, accessToken);

  if (result.status === 200 && result.data.data?.id) {
    console.log('✅ Get asset by ID successful');
    console.log(`   Name: ${result.data.data.name}`);
    console.log(`   Category: ${result.data.data.category}`);
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Location: ${result.data.data.location}`);
    return true;
  } else {
    console.log('❌ Get asset by ID failed:', result.data.message || result.error);
    return false;
  }
}

async function test5_UpdateAsset() {
  console.log('\n5️⃣  Testing Update Asset...');
  const updateData = {
    status: 'MAINTENANCE',
    notes: 'Scheduled maintenance - Updated by test script',
    lastMaintenanceDate: new Date().toISOString()
  };

  const result = await request('PUT', `/assets/${testAssetId}`, updateData, accessToken);

  if (result.status === 200 && result.data.data?.id) {
    console.log('✅ Update asset successful');
    console.log(`   New status: ${result.data.data.status}`);
    console.log(`   Updated notes: ${result.data.data.notes}`);
    return true;
  } else {
    console.log('❌ Update asset failed:', result.data.message || result.error);
    return false;
  }
}

async function test6_GetAssetStats() {
  console.log('\n6️⃣  Testing Get Asset Statistics...');
  const result = await request('GET', '/assets/stats', null, accessToken);

  if (result.status === 200 && result.data.data) {
    console.log('✅ Get asset stats successful');
    console.log(`   Total assets: ${result.data.data.total}`);
    console.log(`   By category:`, result.data.data.byCategory);
    console.log(`   By status:`, result.data.data.byStatus);
    console.log(`   By criticality:`, result.data.data.byCriticality);
    return true;
  } else {
    console.log('❌ Get asset stats failed:', result.data.message || result.error);
    return false;
  }
}

async function test7_GenerateQRCode() {
  console.log('\n7️⃣  Testing Generate QR Code...');
  const result = await request('GET', `/assets/${testAssetId}/qr`, null, accessToken);

  if (result.status === 200 && result.data.data?.qrCode) {
    console.log('✅ QR code generated successfully');
    console.log(`   Asset UID: ${result.data.data.assetUid}`);
    console.log(`   QR Code length: ${result.data.data.qrCode.length} chars`);
    console.log(`   URL: ${result.data.data.url}`);
    return true;
  } else {
    console.log('❌ Generate QR code failed:', result.data.message || result.error);
    return false;
  }
}

async function test8_FilterAssets() {
  console.log('\n8️⃣  Testing Filter Assets by Category...');
  const result = await request('GET', '/assets?category=CNC_MACHINE&page=1&limit=10', null, accessToken);

  if (result.status === 200 && result.data.data?.assets) {
    console.log('✅ Filter assets successful');
    console.log(`   CNC machines found: ${result.data.data.assets.length}`);
    return true;
  } else {
    console.log('❌ Filter assets failed:', result.data.message || result.error);
    return false;
  }
}

async function test9_BulkGenerateQR() {
  console.log('\n9️⃣  Testing Bulk Generate QR Codes...');
  const result = await request('POST', '/assets/bulk-qr', {
    assetIds: [testAssetId]
  }, accessToken);

  if (result.status === 200 && result.data.data?.qrCodes) {
    console.log('✅ Bulk QR generation successful');
    console.log(`   QR codes generated: ${result.data.data.count}`);
    return true;
  } else {
    console.log('❌ Bulk QR generation failed:', result.data.message || result.error);
    return false;
  }
}

async function test10_DeleteAsset() {
  console.log('\n🔟 Testing Delete Asset...');
  const result = await request('DELETE', `/assets/${testAssetId}`, null, accessToken);

  if (result.status === 200) {
    console.log('✅ Asset deleted successfully');
    return true;
  } else {
    console.log('❌ Delete asset failed:', result.data.message || result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Assets API Tests...');
  console.log('=====================================');

  const tests = [
    test1_Login,
    test2_CreateAsset,
    test3_GetAllAssets,
    test4_GetAssetById,
    test5_UpdateAsset,
    test6_GetAssetStats,
    test7_GenerateQRCode,
    test8_FilterAssets,
    test9_BulkGenerateQR,
    test10_DeleteAsset
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
