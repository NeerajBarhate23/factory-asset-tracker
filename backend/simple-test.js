// Simple API Test using Fetch
const http = require('http');

async function testAPI() {
  console.log('\n🧪 Testing Backend API...\n');
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  const healthOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  };
  
  const healthReq = http.request(healthOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response:`, JSON.parse(data));
      
      // Test 2: Login
      console.log('\n2️⃣ Testing Login Endpoint...');
      const loginData = JSON.stringify({
        email: 'admin@factory.com',
        password: 'password123'
      });
      
      const loginOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length
        }
      };
      
      const loginReq = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode}`);
          const loginResponse = JSON.parse(data);
          if (loginResponse.data && loginResponse.data.accessToken) {
            console.log(`   ✅ Login successful!`);
            console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})`);
            console.log(`   Token: ${loginResponse.data.accessToken.substring(0, 50)}...`);
            
            // Test 3: Get Current User
            console.log('\n3️⃣ Testing Get Current User Endpoint...');
            const meOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/auth/me',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${loginResponse.data.accessToken}`
              }
            };
            
            const meReq = http.request(meOptions, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                const meResponse = JSON.parse(data);
                console.log(`   User Data:`, meResponse);
                
                console.log('\n✅ All basic tests passed!\n');
              });
            });
            meReq.on('error', (e) => console.error(`   ❌ Error: ${e.message}`));
            meReq.end();
          } else {
            console.log(`   ❌ Login failed:`, loginResponse);
          }
        });
      });
      loginReq.on('error', (e) => console.error(`   ❌ Error: ${e.message}`));
      loginReq.write(loginData);
      loginReq.end();
    });
  });
  
  healthReq.on('error', (e) => {
    console.error(`   ❌ Error: ${e.message}`);
    console.error('   Make sure the server is running on port 5000');
  });
  healthReq.end();
}

testAPI();
