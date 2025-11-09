const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = '127.0.0.1:5000';
let authToken = '';
let testAssetId = '';
let uploadedFileId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, isMultipart = false, filePath = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: {
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      }
    };

    if (isMultipart && filePath) {
      // Read file
      const fileContent = fs.readFileSync(filePath);
      const pathModule = require('path');
      const fileName = pathModule.basename(filePath);
      const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 
                       fileName.endsWith('.png') ? 'image/png' :
                       fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' : 'text/plain';
      
      // Create boundary
      const boundary = '----TestBoundary' + Date.now();
      
      // Build multipart body
      const parts = [];
      
      // Add assetId field
      if (data && data.assetId) {
        parts.push(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="assetId"\r\n\r\n` +
          `${data.assetId}\r\n`
        );
      }
      
      // Add file
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      );
      
      const header = Buffer.from(parts.join(''), 'utf8');
      const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
      const body = Buffer.concat([header, fileContent, footer]);
      
      options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      options.headers['Content-Length'] = body.length;
      
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: responseData });
          }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    } else {
      // Regular JSON request
      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(responseData) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    }
  });
}

// Test runner
async function runTests() {
  console.log('🧪 Testing Files API\n');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = 0;

  try {
    // Test 1: Login
    totalTests++;
    console.log('\n📝 Test 1: Login as admin');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@factory.com',
      password: 'password123'
    });
    
    if (loginResponse.statusCode === 200 && loginResponse.data.success) {
      authToken = loginResponse.data.data.accessToken;
      console.log('✅ Login successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      passedTests++;
    } else {
      console.log('❌ Login failed');
      console.log('   Response:', loginResponse.data);
      return;
    }

    // Test 2: Get test asset
    totalTests++;
    console.log('\n📝 Test 2: Get test asset (MH-001)');
    const assetsResponse = await makeRequest('GET', '/api/assets?search=MH-001');
    
    if (assetsResponse.statusCode === 200 && assetsResponse.data.data.assets.length > 0) {
      testAssetId = assetsResponse.data.data.assets[0].id;
      console.log('✅ Asset found');
      console.log(`   Asset ID: ${testAssetId}`);
      console.log(`   Asset: ${assetsResponse.data.data.assets[0].name}`);
      passedTests++;
    } else {
      console.log('❌ Asset not found');
      return;
    }

    // Test 3: Create test file
    totalTests++;
    console.log('\n📝 Test 3: Create test image file');
    const testFilePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 PNG file
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testFilePath, pngBuffer);
    console.log('✅ Test file created');
    console.log(`   File: ${testFilePath}`);

    // Test 4: Upload file
    totalTests++;
    console.log('\n📝 Test 4: Upload file');
    const uploadResponse = await makeRequest('POST', '/api/files/upload', 
      { assetId: testAssetId }, 
      true, 
      testFilePath
    );
    
    if (uploadResponse.statusCode === 201 && uploadResponse.data.success) {
      uploadedFileId = uploadResponse.data.data.id;
      console.log('✅ File uploaded successfully');
      console.log(`   File ID: ${uploadedFileId}`);
      console.log(`   Original Name: ${uploadResponse.data.data.fileName}`);
      console.log(`   Size: ${uploadResponse.data.data.fileSize} bytes`);
      console.log(`   Type: ${uploadResponse.data.data.fileType}`);
      passedTests++;
    } else {
      console.log('❌ File upload failed');
      console.log('   Response:', uploadResponse.data);
    }

    // Test 5: Get file metadata
    totalTests++;
    console.log('\n📝 Test 5: Get file metadata by ID');
    const fileResponse = await makeRequest('GET', `/api/files/${uploadedFileId}`);
    
    if (fileResponse.statusCode === 200 && fileResponse.data.success) {
      console.log('✅ File metadata retrieved');
      console.log(`   File: ${fileResponse.data.data.fileName}`);
      console.log(`   Asset: ${fileResponse.data.data.asset.name}`);
      console.log(`   Preview URL: ${fileResponse.data.data.previewUrl}`);
      console.log(`   Uploaded by: ${fileResponse.data.data.uploadedBy.name}`);
      passedTests++;
    } else {
      console.log('❌ Failed to get file metadata');
      console.log('   Response:', fileResponse.data);
    }

    // Test 6: Get asset files
    totalTests++;
    console.log('\n📝 Test 6: Get all files for asset');
    const assetFilesResponse = await makeRequest('GET', `/api/files/asset/${testAssetId}`);
    
    if (assetFilesResponse.statusCode === 200 && assetFilesResponse.data.success) {
      console.log('✅ Asset files retrieved');
      console.log(`   Total files: ${assetFilesResponse.data.data.length}`);
      assetFilesResponse.data.data.forEach((file, index) => {
        console.log(`   File ${index + 1}: ${file.fileName} (${file.fileSize} bytes)`);
      });
      passedTests++;
    } else {
      console.log('❌ Failed to get asset files');
      console.log('   Response:', assetFilesResponse.data);
    }

    // Test 7: Get file statistics
    totalTests++;
    console.log('\n📝 Test 7: Get file statistics');
    const statsResponse = await makeRequest('GET', '/api/files/stats');
    
    if (statsResponse.statusCode === 200 && statsResponse.data.success) {
      console.log('✅ File statistics retrieved');
      console.log(`   Total files: ${statsResponse.data.data.totalFiles}`);
      console.log(`   Total size: ${statsResponse.data.data.totalSizeMB} MB`);
      console.log(`   Files by type:`, statsResponse.data.data.filesByType);
      console.log(`   Recent uploads: ${statsResponse.data.data.recentUploads.length}`);
      passedTests++;
    } else {
      console.log('❌ Failed to get statistics');
      console.log('   Response:', statsResponse.data);
    }

    // Test 8: Preview file (check headers, not content)
    totalTests++;
    console.log('\n📝 Test 8: Preview file (check response)');
    const previewResponse = await makeRequest('GET', `/api/files/${uploadedFileId}/preview`);
    
    if (previewResponse.statusCode === 200) {
      console.log('✅ File preview accessible');
      console.log(`   Status: ${previewResponse.statusCode}`);
      console.log(`   Note: File streaming works (preview in browser available)`);
      passedTests++;
    } else {
      console.log('❌ File preview failed');
      console.log('   Response:', previewResponse);
    }

    // Test 9: Upload another file (PDF simulation)
    totalTests++;
    console.log('\n📝 Test 9: Upload PDF file');
    const testPdfPath = path.join(__dirname, 'test-document.pdf');
    
    // Create a minimal valid PDF
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
411
%%EOF`;
    
    fs.writeFileSync(testPdfPath, pdfContent);
    
    const uploadPdfResponse = await makeRequest('POST', '/api/files/upload', 
      { assetId: testAssetId }, 
      true, 
      testPdfPath
    );
    
    let pdfFileId = '';
    if (uploadPdfResponse.statusCode === 201 && uploadPdfResponse.data.success) {
      pdfFileId = uploadPdfResponse.data.data.id;
      console.log('✅ PDF uploaded successfully');
      console.log(`   File ID: ${pdfFileId}`);
      console.log(`   Type: ${uploadPdfResponse.data.data.fileType}`);
      passedTests++;
    } else {
      console.log('❌ PDF upload failed');
      console.log('   Response:', uploadPdfResponse.data);
    }

    // Test 10: Delete file
    totalTests++;
    console.log('\n📝 Test 10: Delete file');
    const deleteResponse = await makeRequest('DELETE', `/api/files/${uploadedFileId}`);
    
    if (deleteResponse.statusCode === 200 && deleteResponse.data.success) {
      console.log('✅ File deleted successfully');
      console.log(`   Deleted file ID: ${deleteResponse.data.data.id}`);
      passedTests++;
    } else {
      console.log('❌ File deletion failed');
      console.log('   Response:', deleteResponse.data);
    }

    // Test 11: Verify file deleted
    totalTests++;
    console.log('\n📝 Test 11: Verify file deleted');
    const verifyDeleteResponse = await makeRequest('GET', `/api/files/${uploadedFileId}`);
    
    if (verifyDeleteResponse.statusCode === 404) {
      console.log('✅ File properly deleted (404 as expected)');
      passedTests++;
    } else {
      console.log('❌ File still exists after deletion');
      console.log('   Response:', verifyDeleteResponse.data);
    }

    // Test 12: Delete PDF file
    if (pdfFileId) {
      totalTests++;
      console.log('\n📝 Test 12: Delete PDF file');
      const deletePdfResponse = await makeRequest('DELETE', `/api/files/${pdfFileId}`);
      
      if (deletePdfResponse.statusCode === 200 && deletePdfResponse.data.success) {
        console.log('✅ PDF file deleted successfully');
        passedTests++;
      } else {
        console.log('❌ PDF deletion failed');
        console.log('   Response:', deletePdfResponse.data);
      }
    }

    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    try {
      if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
      if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
      console.log('✅ Test files cleaned up');
    } catch (e) {
      console.log('⚠️  Could not clean up test files:', e.message);
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`   Success Rate: ${percentage}%\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Files API is working perfectly.\n');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Please review the output above.\n`);
  }
}

// Wait for server to start then run tests
console.log('⏳ Waiting for server to start...\n');
setTimeout(runTests, 3000);
