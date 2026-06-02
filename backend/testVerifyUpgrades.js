require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Hospital = require('./src/models/Hospital');
const BloodBank = require('./src/models/BloodBank');
const DonationMatch = require('./src/models/DonationMatch');
const SystemSettings = require('./src/models/SystemSettings');
const { generateMatchPDF } = require('./src/services/pdfService');

const runTests = async () => {
  console.log('🧪 Starting programmatic validation of OneBlood upgrades...');
  
  // Connect to DB (or use local memory server if offline)
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oneblood';
  await mongoose.connect(MONGO_URI);
  console.log('🟢 MongoDB Connected');

  // 1. Verify Settings
  const settings = await SystemSettings.getSettings();
  console.log('🟢 SystemSettings verified:', settings.emailProvider);

  // 2. Mock Entities
  const testEmail = `seeker-${Date.now()}@test.com`;
  const seeker = await User.create({
    onebloodId: 'OB-SEEK99',
    name: 'Test Seeker',
    email: testEmail,
    role: 'patient',
    city: 'Hubballi'
  });
  console.log('🟢 Seeker Created:', seeker.onebloodId);

  const donor = await User.create({
    onebloodId: 'OB-DNOR99',
    name: 'Test Donor',
    email: `donor-${Date.now()}@test.com`,
    role: 'donor',
    city: 'Hubballi'
  });
  console.log('🟢 Donor Created:', donor.onebloodId);

  const hospital = await Hospital.create({
    userId: seeker._id, // link to dummy
    hospitalName: 'Tatwadarsha Hospital Hubli',
    registrationNumber: 'TATWA-001',
    hospitalType: 'Private',
    address: 'Hubli',
    city: 'Hubballi',
    state: 'Karnataka',
    pincode: '580020',
    emergencyContact: '+919999999999',
    authorizedPersonName: 'Director',
    designation: 'MD',
    verificationStatus: 'approved',
    location: { type: 'Point', coordinates: [75.12, 15.36] }
  });
  console.log('🟢 Hospital Created:', hospital.hospitalName);

  // 3. Verify Match OBID Generation
  const matchObid = await DonationMatch.generateMatchId();
  const match = await DonationMatch.create({
    matchObid,
    seekerId: seeker._id,
    donorId: donor._id,
    destinationType: 'Hospital',
    hospitalId: hospital._id,
    requestId: new mongoose.Types.ObjectId(),
    bloodGroup: 'O+',
    units: 1,
    status: 'in_progress'
  });
  console.log('🟢 Match Created:', match.matchObid);

  // 4. Verify PDF Compilation
  const pdfPath = await generateMatchPDF(match, seeker, donor, hospital);
  console.log('🟢 PDF compiled successfully at:', pdfPath);

  // Clean up
  await User.findByIdAndDelete(seeker._id);
  await User.findByIdAndDelete(donor._id);
  await Hospital.findByIdAndDelete(hospital._id);
  await DonationMatch.findByIdAndDelete(match._id);
  console.log('🧹 Test records cleaned up.');

  await mongoose.disconnect();
  console.log('👋 Done. Validation Passed!');
  process.exit(0);
};

runTests().catch(err => {
  console.error('🔴 Validation failed:', err.message);
  process.exit(1);
});
