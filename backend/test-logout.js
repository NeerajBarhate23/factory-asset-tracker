// Quick logout test
const http = require('http');

async function testLogout() {
  console.log('\n🧪 Testing Logout...\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginData = JSON.stringify({
    email: 'operator@factory.com',
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
      console.log('Raw response:', data);
      const loginResponse = JSON.parse(data);
      console.log('Parsed response:', loginResponse);
      if (loginResponse.data && loginResponse.data.accessToken) {
        console.log('✅ Login successful');
        const token = loginResponse.data.accessToken;
        
        // Step 2: Logout immediately
        console.log('\nStep 2: Logging out...');
        const logoutOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/logout',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const logoutReq = http.request(logoutOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`Status: ${res.statusCode}`);
            const logoutResponse = JSON.parse(data);
            console.log('Response:', logoutResponse);
            if (res.statusCode === 200) {
              console.log('✅ Logout successful!\n');
            } else {
              console.log('❌ Logout failed\n');
            }
          });
        });
        logoutReq.on('error', (e) => console.error(`❌ Error: ${e.message}`));
        logoutReq.end();
      } else {
        console.log('❌ Login failed');
      }
    });
  });
  loginReq.on('error', (e) => console.error(`❌ Error: ${e.message}`));
  loginReq.write(loginData);
  loginReq.end();
}

testLogout();
