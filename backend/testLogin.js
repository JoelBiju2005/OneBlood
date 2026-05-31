const https = require('https');

const payload = JSON.stringify({ email: 'admin@oneblood.in', password: 'OneBloodAdmin2026!' });

const options = {
  hostname: 'oneblood-nvg1.onrender.com',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const parsed = JSON.parse(data);
    if (parsed.user) {
      console.log('✅ Login SUCCESS! User:', parsed.user.name, '| Role:', parsed.user.role, '| OneBlood ID:', parsed.user.onebloodId);
    } else {
      console.log('Response:', JSON.stringify(parsed, null, 2));
    }
  });
});

req.on('error', err => console.error('❌ Error:', err.message));
req.write(payload);
req.end();
