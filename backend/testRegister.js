const https = require('https');

function request(path, method, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'oneblood-nvg1.onrender.com',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', err => resolve({ status: 0, body: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  // Test register (new unique email)
  const testEmail = `test${Date.now()}@oneblood.test`;
  console.log('Testing registration with:', testEmail);
  const reg = await request('/api/auth/register', 'POST', {
    name: 'Test User', email: testEmail, phone: '9999999999', password: 'Test1234!'
  });
  console.log('Register Status:', reg.status);
  const parsed = JSON.parse(reg.body);
  if (parsed.user) {
    console.log('✅ Register SUCCESS! OneBlood ID:', parsed.user.onebloodId);
  } else {
    console.log('Register Response:', JSON.stringify(parsed, null, 2));
  }
}

main();
