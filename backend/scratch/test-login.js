const axios = require('axios');

async function test() {
  try {
    console.log('Logging in as donor@oneblood.in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'donor@oneblood.in',
      password: 'Donor@123'
    });
    console.log('Response Status:', loginRes.status);
    console.log('Response Data:', JSON.stringify(loginRes.data, null, 2));
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

test();
