const axios = require('axios');

async function run() {
  try {
    const email = `test_${Date.now()}@oneblood.in`;
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Unique ID User',
      email,
      phone: '9876543210',
      password: 'Password@123',
      role: 'patient'
    });
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Registration failed:', err.response?.data || err.message);
  }
}

run();
