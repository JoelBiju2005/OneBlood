const fs = require('fs');
const path = require('path');
const { verifyDoctorLetter } = require('../src/services/aiVerification');

async function test() {
  try {
    const imagePath = path.join(__dirname, '../uploads/1779912769614-3ikwbl.jpg');
    console.log('Testing image:', imagePath);
    if (!fs.existsSync(imagePath)) {
      console.error('Image file does not exist');
      return;
    }
    
    const buffer = fs.readFileSync(imagePath);
    console.log('Running verifyDoctorLetter...');
    const result = await verifyDoctorLetter(buffer, 'image/jpeg');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error during verification test:', error);
  }
}

test();
