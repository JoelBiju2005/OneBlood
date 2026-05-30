const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTest = async () => {
  try {
    console.log('Testing Signup...');
    const signupRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'New Tester',
      email: `tester_${Date.now()}@oneblood.in`,
      phone: '9876543210',
      password: 'Password@123',
      role: 'donor'
    });
    console.log('Signup success! User data:', signupRes.data.user);
    const { onebloodId, email } = signupRes.data.user;

    console.log('\nTesting Login with ID...');
    const loginIdRes = await axios.post(`${API_URL}/auth/login`, {
      onebloodId,
      email: '',
      password: 'Password@123'
    });
    console.log('Login with ID success! User:', loginIdRes.data.user);

    console.log('\nTesting Login with Email...');
    const loginEmailRes = await axios.post(`${API_URL}/auth/login`, {
      onebloodId: '',
      email,
      password: 'Password@123'
    });
    console.log('Login with Email success! User:', loginEmailRes.data.user);

    console.log('\nAll API tests passed successfully!');
  } catch (err) {
    console.error('Error during API test:', err.response?.data || err.message);
  }
};

runTest();
