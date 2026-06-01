const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SEED_ADMIN_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const fullInventory = (m = 1) => ({
  wholeBlood:          { Apos: Math.round(18*m), Aneg: Math.round(4*m), Bpos: Math.round(20*m), Bneg: Math.round(3*m), ABpos: Math.round(8*m), ABneg: Math.round(2*m), Opos: Math.round(22*m), Oneg: Math.round(4*m) },
  packedRBC:           { Apos: Math.round(15*m), Aneg: Math.round(3*m), Bpos: Math.round(17*m), Bneg: Math.round(2*m), ABpos: Math.round(6*m), ABneg: Math.round(1*m), Opos: Math.round(20*m), Oneg: Math.round(3*m) },
  freshFrozenPlasma:   { Apos: Math.round(12*m), Aneg: Math.round(2*m), Bpos: Math.round(14*m), Bneg: Math.round(2*m), ABpos: Math.round(5*m), ABneg: Math.round(1*m), Opos: Math.round(16*m), Oneg: Math.round(2*m) },
  platelets:           { Apos: Math.round(10*m), Aneg: Math.round(2*m), Bpos: Math.round(12*m), Bneg: Math.round(1*m), ABpos: Math.round(4*m), ABneg: Math.round(1*m), Opos: Math.round(14*m), Oneg: Math.round(2*m) },
  cryoprecipitate:     { Apos: Math.round(8*m),  Aneg: Math.round(1*m), Bpos: Math.round(9*m),  Bneg: Math.round(1*m), ABpos: Math.round(3*m), ABneg: Math.round(1*m), Opos: Math.round(10*m), Oneg: Math.round(1*m) },
  singleDonorPlatelets:{ Apos: Math.round(6*m),  Aneg: Math.round(1*m), Bpos: Math.round(7*m),  Bneg: Math.round(1*m), ABpos: Math.round(3*m), ABneg: Math.round(0*m), Opos: Math.round(8*m),  Oneg: Math.round(1*m) }
});

const HUBLI_BANKS = [
  { name: 'Rashtrotthana Blood Centre', registrationNumber: 'KA-BB-101', address: '2nd Floor, Dee Jay Building, Neeligin Rd', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580029', location: { type: 'Point', coordinates: [75.1384, 15.3524] }, phone: '0836 235 8838', email: 'contact@rashtrotthana.org', facilities: ['24x7', 'Component Separation'], operatingHours: '24x7', inventory: fullInventory(1.2) },
  { name: 'PREMA BINDU BLOOD CENTRE', registrationNumber: 'KA-BB-102', address: 'Opp. BVB College', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580031', location: { type: 'Point', coordinates: [75.1221, 15.3705] }, phone: '072044 11222', email: 'premabindu@gmail.com', facilities: ['24x7'], operatingHours: '24x7', inventory: fullInventory(1.5) },
  { name: 'Karnataka Medical College Hospital Blood Bank', registrationNumber: 'KA-BB-103', address: '946J+H9R KIMS OPD, Casualty and Emergency', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580021', location: { type: 'Point', coordinates: [75.1311, 15.3621] }, phone: '080 2272 9080', email: 'kims.bloodbank@gmail.com', facilities: ['24x7', 'Government Hospital'], operatingHours: '24x7', inventory: fullInventory(2.0) },
  { name: 'Hubli Lions Blood Bank', registrationNumber: 'KA-BB-104', address: 'Vivekanand General Hospital Compound, Deshpande Nagar', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580029', location: { type: 'Point', coordinates: [75.1415, 15.3489] }, phone: '0836 225 8080', email: 'hublilionsbb@yahoo.com', facilities: ['Component Separation'], operatingHours: '9:30 am - 6:00 pm', inventory: fullInventory(0.8) },
  { name: 'Dr.Jeevannavars Blood Bank', registrationNumber: 'KA-BB-105', address: '943J+F73, Gokul Rd', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580030', location: { type: 'Point', coordinates: [75.1235, 15.3601] }, phone: '0836 227 8320', email: 'jeevannavarbb@gmail.com', facilities: ['Private'], operatingHours: '9:00 am - 8:00 pm', inventory: fullInventory(0.7) },
  { name: 'Life Line 24X7 Blood Bank', registrationNumber: 'KA-BB-106', address: 'Hubballi', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580020', location: { type: 'Point', coordinates: [75.1350, 15.3650] }, phone: '0836 233 0000', email: 'lifeline24x7@gmail.com', facilities: ['24x7'], operatingHours: '24x7', inventory: fullInventory(1.0) },
  { name: 'M R Diagnostic Research Centre & Blood Bank', registrationNumber: 'KA-BB-107', address: '947F+VH8, Ground Floor, Eureka Tower, Traffic Island', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580029', location: { type: 'Point', coordinates: [75.1425, 15.3512] }, phone: '0836 225 3450', email: 'mrdiagnosticbb@gmail.com', facilities: ['Component Separation'], operatingHours: '9:00 am - 8:00 pm', inventory: fullInventory(0.9) },
  { name: 'SDM Blood Bank', registrationNumber: 'KA-BB-108', address: 'C29X+8HR, Sattur', city: 'Dharwad', district: 'Dharwad', state: 'Karnataka', pincode: '580009', location: { type: 'Point', coordinates: [75.0312, 15.4215] }, phone: '0836 247 7777', email: 'sdmbloodbank@sdm.edu', facilities: ['24x7', 'Medical College', 'Component Separation'], operatingHours: '24x7', inventory: fullInventory(2.2) },
  { name: 'Dharwad Blood Bank Dharwad', registrationNumber: 'KA-BB-109', address: 'Sukruth bulg opp kc park main gate, near panjurli hotel', city: 'Dharwad', district: 'Dharwad', state: 'Karnataka', pincode: '580008', location: { type: 'Point', coordinates: [75.0089, 15.4521] }, phone: '0836 295 8444', email: 'dharwadbb@gmail.com', facilities: ['24x7'], operatingHours: '24x7', inventory: fullInventory(1.4) },
  { name: 'Sanmati Clinical Lab & Vol Blood Bank', registrationNumber: 'KA-BB-110', address: 'Beside Bombay Dyeing, near S T Bhandaris Saree Shop', city: 'Hubballi', district: 'Dharwad', state: 'Karnataka', pincode: '580020', location: { type: 'Point', coordinates: [75.1432, 15.3551] }, phone: '0836 222 8348', email: 'sanmatilab@gmail.com', facilities: ['Private'], operatingHours: '10:00 am - 6:00 pm', inventory: fullInventory(0.5) }
];

router.get('/status', (req, res) => {
  res.json({ version: 'hubli-v1', count: HUBLI_BANKS.length });
});

router.post('/seed', async (req, res) => {
  try {
    const BloodBank = require('../models/BloodBank');
    
    // Delete existing Hubli/Dharwad specific ones we are about to add (if any)
    await BloodBank.deleteMany({ registrationNumber: { $in: HUBLI_BANKS.map(b => b.registrationNumber) } });

    const toInsert = HUBLI_BANKS.map(b => ({
      ...b,
      adminUserId: SEED_ADMIN_ID,
      isVerified: true,
      isActive: true,
      lastInventoryUpdate: new Date(),
      acceptsWalkIn: true,
      acceptsOnlineRequest: true,
    }));

    const inserted = await BloodBank.insertMany(toInsert, { ordered: false });
    
    res.json({
      success: true,
      inserted: inserted.length
    });
  } catch (err) {
    console.error('[HubliSeed]', err);
    res.status(500).json({ message: err.message, errors: err.writeErrors });
  }
});

module.exports = router;
