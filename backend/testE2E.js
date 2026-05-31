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
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', err => resolve({ status: 0, body: { error: err.message } }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const testEmail = `e2e${Date.now()}@oneblood.in`;
  const testPass = 'E2ETest1234!';
  const testName = 'E2E Test User';

  console.log('═══════════════════════════════════════════');
  console.log('  OneBlood Live E2E Test – MongoDB Atlas');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Register
  console.log('Step 1: Register new account...');
  const reg = await request('/api/auth/register', 'POST', {
    name: testName, email: testEmail, phone: '9876543210', password: testPass
  });
  if (reg.status !== 201) {
    console.log('❌ Register FAILED:', reg.body);
    return;
  }
  const ob_id = reg.body.user.onebloodId;
  console.log(`✅ Registered! OneBlood ID: ${ob_id}\n`);

  // Step 2: Login with email
  console.log('Step 2: Login with email + password...');
  const loginEmail = await request('/api/auth/login', 'POST', { email: testEmail, password: testPass });
  if (loginEmail.status !== 200) {
    console.log('❌ Email login FAILED:', loginEmail.body);
    return;
  }
  console.log(`✅ Email login success! Name: ${loginEmail.body.user.name}\n`);

  // Step 3: Login with OneBlood ID
  console.log('Step 3: Login with OneBlood ID...');
  const loginId = await request('/api/auth/login', 'POST', { onebloodId: ob_id, password: testPass });
  if (loginId.status !== 200) {
    console.log('❌ OneBlood ID login FAILED:', loginId.body);
    return;
  }
  console.log(`✅ OneBlood ID login success!\n`);

  // Step 4: Admin login
  console.log('Step 4: Admin login...');
  const adminLogin = await request('/api/auth/login', 'POST', { email: 'admin@oneblood.in', password: 'OneBloodAdmin2026!' });
  if (adminLogin.status !== 200) {
    console.log('❌ Admin login FAILED:', adminLogin.body);
    return;
  }
  console.log(`✅ Admin login success! Role: ${adminLogin.body.user.role}\n`);

  console.log('═══════════════════════════════════════════');
  console.log('🎉 ALL TESTS PASSED – Website is fully live!');
  console.log('   Frontend: https://oneblood-app.web.app');
  console.log('   Backend:  https://oneblood-nvg1.onrender.com');
  console.log('   Database: MongoDB Atlas (cloud, always on)');
  console.log('═══════════════════════════════════════════');
}

main();
