const axios = require('axios');

async function test() {
  try {
    console.log('Fetching public stats from /api/stats/public...');
    const res = await axios.get('http://localhost:5000/api/stats/public');
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Error fetching public stats:', error.response?.data || error.message);
  }
}

test();
