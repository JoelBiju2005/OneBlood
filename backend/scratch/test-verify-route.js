const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function test() {
  try {
    // 1. Login to get JWT
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'donor@oneblood.in',
      password: 'Donor@123'
    });
    const token = loginRes.data.accessToken;
    console.log('Logged in successfully, token received.');

    // 2. Prepare upload file
    const imagePath = path.join(__dirname, '../uploads/1779912769614-3ikwbl.jpg');
    if (!fs.existsSync(imagePath)) {
      console.error('Image file does not exist at:', imagePath);
      return;
    }

    const form = new FormData();
    form.append('letter', fs.createReadStream(imagePath));

    // 3. Post to verify-letter route
    console.log('Uploading letter to /api/requests/verify-letter...');
    const verifyRes = await axios.post('http://localhost:5000/api/requests/verify-letter', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Response Status:', verifyRes.status);
    console.log('Response Data:', JSON.stringify(verifyRes.data, null, 2));
  } catch (error) {
    console.error('Error in route test:', error.response?.data || error.message);
  }
}

test();
