const http = require('http');

const url = 'http://localhost:5000/api/search/unified?bloodGroup=AB-&component=prbc&lat=15.369061&lng=75.156613&radius=25';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('--- Donors ---');
      console.log(JSON.stringify(parsed.donors, null, 2));
      console.log('--- Banks ---');
      console.log(JSON.stringify(parsed.bloodBanks, null, 2));
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
});
