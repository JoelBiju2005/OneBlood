const axios = require('axios');

async function test() {
  try {
    // 1. Login to get JWT
    console.log('Logging in as donor...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'donor@oneblood.in',
      password: 'Donor@123'
    });
    const token = loginRes.data.accessToken;
    console.log('Logged in successfully.');

    // 2. Fetch all open notices
    console.log('Fetching notices...');
    const noticesRes = await axios.get('http://localhost:5000/api/noticeboard');
    const notices = noticesRes.data;
    if (notices.length === 0) {
      console.log('No open notices found in database. Seed the database first or post a notice.');
      return;
    }
    const targetNotice = notices[0];
    console.log(`Found notice: ID: ${targetNotice._id}, Patient: ${targetNotice.patientName}, Current Responses: ${targetNotice.responses?.length || 0}`);

    // 3. Respond with 'can_donate'
    console.log('Responding with can_donate...');
    try {
      const resp1 = await axios.post(`http://localhost:5000/api/noticeboard/${targetNotice._id}/respond`, {
        action: 'can_donate',
        note: 'I will be there at 5pm.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response 1 Status:', resp1.status, resp1.data.message);
    } catch (err) {
      console.log('Response 1 failed (possibly duplicate):', err.response?.data?.message || err.message);
    }

    // 4. Respond with 'know_someone' (referral)
    console.log('Responding with know_someone (referral)...');
    try {
      const resp2 = await axios.post(`http://localhost:5000/api/noticeboard/${targetNotice._id}/respond`, {
        action: 'know_someone',
        note: 'My cousin is willing to help.',
        referralName: 'Rahul Kumar',
        referralPhone: '9876543210',
        referralBloodGroup: 'B-'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Response 2 Status:', resp2.status, resp2.data.message);
    } catch (err) {
      console.log('Response 2 failed (possibly duplicate):', err.response?.data?.message || err.message);
    }

    // 5. Fetch notice again to verify responses were persisted
    console.log('Fetching notice again to verify database persistence...');
    const noticesResUpdated = await axios.get('http://localhost:5000/api/noticeboard');
    const updatedNotice = noticesResUpdated.data.find(n => n._id === targetNotice._id);
    console.log('Updated Responses in DB:', JSON.stringify(updatedNotice.responses, null, 2));

  } catch (error) {
    console.error('Error in route test:', error.response?.data || error.message);
  }
}

test();
