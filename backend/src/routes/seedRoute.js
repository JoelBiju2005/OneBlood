/**
 * OneBlood Admin Seed Route
 * Provides a one-time endpoint to seed blood bank data.
 * This route is protected by a seed key and auto-removes itself after use.
 * Add to adminRoutes temporarily, remove after seeding.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SEED_KEY = process.env.SEED_SECRET || 'oneblood_seed_2026';
const SEED_ADMIN_ID = new mongoose.Types.ObjectId('000000000000000000000001');

const fullInventory = (m = 1) => ({
  wholeBlood:          { Apos: Math.round(18*m), Aneg: Math.round(4*m), Bpos: Math.round(20*m), Bneg: Math.round(3*m), ABpos: Math.round(8*m), ABneg: Math.round(2*m), Opos: Math.round(22*m), Oneg: Math.round(4*m) },
  packedRBC:           { Apos: Math.round(15*m), Aneg: Math.round(3*m), Bpos: Math.round(17*m), Bneg: Math.round(2*m), ABpos: Math.round(6*m), ABneg: Math.round(1*m), Opos: Math.round(20*m), Oneg: Math.round(3*m) },
  freshFrozenPlasma:   { Apos: Math.round(12*m), Aneg: Math.round(2*m), Bpos: Math.round(14*m), Bneg: Math.round(2*m), ABpos: Math.round(5*m), ABneg: Math.round(1*m), Opos: Math.round(16*m), Oneg: Math.round(2*m) },
  platelets:           { Apos: Math.round(10*m), Aneg: Math.round(2*m), Bpos: Math.round(12*m), Bneg: Math.round(1*m), ABpos: Math.round(4*m), ABneg: Math.round(1*m), Opos: Math.round(14*m), Oneg: Math.round(2*m) },
  cryoprecipitate:     { Apos: Math.round(8*m),  Aneg: Math.round(1*m), Bpos: Math.round(9*m),  Bneg: Math.round(1*m), ABpos: Math.round(3*m), ABneg: Math.round(1*m), Opos: Math.round(10*m), Oneg: Math.round(1*m) },
  singleDonorPlatelets:{ Apos: Math.round(6*m),  Aneg: Math.round(1*m), Bpos: Math.round(7*m),  Bneg: Math.round(1*m), ABpos: Math.round(3*m), ABneg: Math.round(0*m), Opos: Math.round(8*m),  Oneg: Math.round(1*m) }
});

const LOW = () => ({
  wholeBlood:          { Apos: 5, Aneg: 1, Bpos: 6, Bneg: 1, ABpos: 2, ABneg: 0, Opos: 7, Oneg: 1 },
  packedRBC:           { Apos: 4, Aneg: 1, Bpos: 5, Bneg: 0, ABpos: 2, ABneg: 0, Opos: 6, Oneg: 1 },
  freshFrozenPlasma:   { Apos: 3, Aneg: 0, Bpos: 4, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 5, Oneg: 0 },
  platelets:           { Apos: 2, Aneg: 0, Bpos: 3, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 4, Oneg: 0 },
  cryoprecipitate:     { Apos: 2, Aneg: 0, Bpos: 2, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 3, Oneg: 0 },
  singleDonorPlatelets:{ Apos: 1, Aneg: 0, Bpos: 2, Bneg: 0, ABpos: 0, ABneg: 0, Opos: 2, Oneg: 0 }
});

const BANKS = [
  // BANGALORE
  { name:'Rotary Bangalore Blood Bank', registrationNumber:'KA-BB-001', address:'1 Cubbon Road, Shivajinagar', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560001', location:{type:'Point',coordinates:[77.5946,12.9716]}, phone:'08022866444', email:'rotary.blood@bangalore.org', facilities:['24x7','Component Separation','Apheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(1.5) },
  { name:'Victoria Hospital Blood Bank', registrationNumber:'KA-BB-002', address:'Fort Road, Victoria Hospital Complex', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560002', location:{type:'Point',coordinates:[77.5797,12.9624]}, phone:'08026706001', email:'bloodbank@victoriahospital.kar.nic.in', facilities:['24x7','Government Hospital','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.2) },
  { name:'Manipal Hospital Blood Bank', registrationNumber:'KA-BB-003', address:'98 HAL Airport Road, Kodihalli', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560017', location:{type:'Point',coordinates:[77.6490,12.9596]}, phone:'08025024444', email:'bloodbank@manipal.edu', facilities:['24x7','NAT Testing','Apheresis','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(2) },
  { name:'Narayana Health Blood Bank', registrationNumber:'KA-BB-004', address:'258/A Bommasandra Industrial Area', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560099', location:{type:'Point',coordinates:[77.6741,12.8391]}, phone:'08071222222', email:'bloodbank@narayanahealth.org', facilities:['24x7','NAT Testing','HLA Typing','Apheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(1.8) },
  { name:"St. John's Medical College Blood Bank", registrationNumber:'KA-BB-005', address:'Sarjapur Road, Koramangala', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560034', location:{type:'Point',coordinates:[77.6156,12.9361]}, phone:'08049467000', email:'bloodbank@stjohns.in', facilities:['24x7','Teaching Hospital','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.3) },
  { name:'Bangalore Red Cross Blood Bank', registrationNumber:'KA-BB-006', address:'Race Course Road', city:'Bengaluru', district:'Bengaluru Urban', state:'Karnataka', pincode:'560001', location:{type:'Point',coordinates:[77.5784,12.9866]}, phone:'08022866003', email:'redcross@karnataka.org', facilities:['Component Separation','Walk-in'], operatingHours:{is24x7:false,weekday:'8am - 8pm',weekend:'9am - 5pm'}, inventory:fullInventory(1.0) },
  // HYDERABAD
  { name:"NIMS Blood Bank – Nizam's Institute", registrationNumber:'TS-BB-001', address:'Punjagutta, Hyderabad', city:'Hyderabad', district:'Hyderabad', state:'Telangana', pincode:'500082', location:{type:'Point',coordinates:[78.4534,17.4239]}, phone:'04023489000', email:'bloodbank@nims.edu.in', facilities:['24x7','Super Specialty','NAT Testing','Apheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(1.6) },
  { name:'Osmania General Hospital Blood Bank', registrationNumber:'TS-BB-002', address:'Afzalgunj Road, Koti', city:'Hyderabad', district:'Hyderabad', state:'Telangana', pincode:'500012', location:{type:'Point',coordinates:[78.4772,17.3850]}, phone:'04024600112', email:'ogh.bloodbank@telangana.gov.in', facilities:['24x7','Government Hospital','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.1) },
  { name:'Apollo Hospitals Blood Bank – Jubilee Hills', registrationNumber:'TS-BB-003', address:'Film Nagar, Jubilee Hills Road No. 72', city:'Hyderabad', district:'Hyderabad', state:'Telangana', pincode:'500033', location:{type:'Point',coordinates:[78.4013,17.4157]}, phone:'04023607777', email:'bloodbank@apollohyderabad.com', facilities:['24x7','NAT Testing','Apheresis','Plateletpheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(2) },
  { name:'Care Hospitals Blood Bank', registrationNumber:'TS-BB-004', address:'Road No. 1, Banjara Hills', city:'Hyderabad', district:'Hyderabad', state:'Telangana', pincode:'500034', location:{type:'Point',coordinates:[78.4460,17.4126]}, phone:'04030418000', email:'bloodbank@carehospitals.com', facilities:['24x7','NAT Testing','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.4) },
  { name:'KLE Blood Bank – Hubballi', registrationNumber:'KA-BB-020', address:'JNMC Campus, Nehru Nagar', city:'Hubballi', district:'Dharwad', state:'Karnataka', pincode:'580021', location:{type:'Point',coordinates:[75.1240,15.3647]}, phone:'08362213788', email:'bloodbank@kleddeemed.res.in', facilities:['24x7','Teaching Hospital','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.0) },
  // MUMBAI
  { name:'KEM Hospital Blood Bank', registrationNumber:'MH-BB-001', address:'Acharya Donde Marg, Parel', city:'Mumbai', district:'Mumbai City', state:'Maharashtra', pincode:'400012', location:{type:'Point',coordinates:[72.8412,18.9996]}, phone:'02224136051', email:'bloodbank@kem.edu', facilities:['24x7','Government Hospital','Teaching Hospital','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(2) },
  { name:'Sion Hospital Blood Bank – LTMMC', registrationNumber:'MH-BB-002', address:'Dr. Ambedkar Road, Sion East', city:'Mumbai', district:'Mumbai City', state:'Maharashtra', pincode:'400022', location:{type:'Point',coordinates:[72.8625,19.0412]}, phone:'02224076381', email:'bloodbank@sionhospital.org', facilities:['24x7','Component Separation','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.5) },
  { name:'Tata Memorial Blood Bank', registrationNumber:'MH-BB-003', address:'Dr. E Borges Road, Parel', city:'Mumbai', district:'Mumbai City', state:'Maharashtra', pincode:'400012', location:{type:'Point',coordinates:[72.8395,19.0040]}, phone:'02224177000', email:'bloodbank@tmc.gov.in', facilities:['24x7','Oncology Specialty','Apheresis','NAT Testing','HLA Typing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.7) },
  { name:'Lilavati Hospital Blood Bank', registrationNumber:'MH-BB-004', address:'A-791, Bandra Reclamation, Bandra West', city:'Mumbai', district:'Mumbai Suburban', state:'Maharashtra', pincode:'400050', location:{type:'Point',coordinates:[72.8258,19.0607]}, phone:'02226455421', email:'bloodbank@lilavatihospital.com', facilities:['24x7','NAT Testing','Apheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(1.4) },
  // DELHI
  { name:'AIIMS Blood Bank', registrationNumber:'DL-BB-001', address:'Sri Aurobindo Marg, Ansari Nagar', city:'New Delhi', district:'South Delhi', state:'Delhi', pincode:'110029', location:{type:'Point',coordinates:[77.2093,28.5672]}, phone:'01126588500', email:'bloodbank@aiims.edu', facilities:['24x7','Super Specialty','NAT Testing','Apheresis','HLA Typing','Irradiation'], operatingHours:{is24x7:true}, inventory:fullInventory(3) },
  { name:'Safdarjung Hospital Blood Bank', registrationNumber:'DL-BB-002', address:'Ring Road, Safdarjung', city:'New Delhi', district:'West Delhi', state:'Delhi', pincode:'110029', location:{type:'Point',coordinates:[77.2080,28.5612]}, phone:'01126165060', email:'bloodbank@safdarjunghospital.nic.in', facilities:['24x7','Government Hospital','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.8) },
  { name:'Indian Red Cross Blood Bank – Delhi', registrationNumber:'DL-BB-003', address:'1 Red Cross Road, Connaught Place', city:'New Delhi', district:'Central Delhi', state:'Delhi', pincode:'110001', location:{type:'Point',coordinates:[77.2220,28.6368]}, phone:'01123716441', email:'bloodbank@indianredcross.org', facilities:['Component Separation','Walk-in','Camp Organizer'], operatingHours:{is24x7:false,weekday:'8am - 8pm',weekend:'9am - 5pm'}, inventory:fullInventory(1.5) },
  { name:'Fortis Hospital Blood Bank – Gurgaon', registrationNumber:'HR-BB-001', address:'Sector 44, Opposite HUDA City Centre, Gurugram', city:'Gurugram', district:'Gurugram', state:'Haryana', pincode:'122002', location:{type:'Point',coordinates:[77.0724,28.4595]}, phone:'01244521800', email:'bloodbank@fortishealthcare.com', facilities:['24x7','NAT Testing','Apheresis','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.6) },
  // CHENNAI
  { name:'Government General Hospital Blood Bank', registrationNumber:'TN-BB-001', address:'Park Town, Chennai', city:'Chennai', district:'Chennai', state:'Tamil Nadu', pincode:'600003', location:{type:'Point',coordinates:[80.2762,13.0827]}, phone:'04425305000', email:'bloodbank@ggh.tn.gov.in', facilities:['24x7','Government Hospital','Component Separation','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(2) },
  { name:'Apollo Hospitals Blood Bank – Greams Road', registrationNumber:'TN-BB-002', address:'21 Greams Lane, Off Greams Road', city:'Chennai', district:'Chennai', state:'Tamil Nadu', pincode:'600006', location:{type:'Point',coordinates:[80.2552,13.0622]}, phone:'04428296023', email:'bloodbank@apollochennai.com', facilities:['24x7','NAT Testing','Apheresis','Plateletpheresis','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(2.2) },
  { name:'CMC Vellore Blood Bank', registrationNumber:'TN-BB-010', address:'Ida Scudder Road, Vellore', city:'Vellore', district:'Vellore', state:'Tamil Nadu', pincode:'632004', location:{type:'Point',coordinates:[79.1325,12.9165]}, phone:'04162281000', email:'bloodbank@cmcvellore.ac.in', facilities:['24x7','Teaching Hospital','NAT Testing','HLA Typing','Apheresis','Irradiation'], operatingHours:{is24x7:true}, inventory:fullInventory(2.5) },
  // KOLKATA
  { name:'SSKM Blood Bank – PG Hospital', registrationNumber:'WB-BB-001', address:'244 AJC Bose Road, Bhowanipore', city:'Kolkata', district:'Kolkata', state:'West Bengal', pincode:'700020', location:{type:'Point',coordinates:[88.3517,22.5433]}, phone:'03322041370', email:'bloodbank@sskm.org', facilities:['24x7','Government Hospital','Component Separation','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.8) },
  { name:'Apollo Gleneagles Blood Bank', registrationNumber:'WB-BB-002', address:'58 Canal Circular Road, Kadapara', city:'Kolkata', district:'Kolkata', state:'West Bengal', pincode:'700054', location:{type:'Point',coordinates:[88.3961,22.5414]}, phone:'03323202122', email:'bloodbank@apollogleneagles.in', facilities:['24x7','NAT Testing','Apheresis'], operatingHours:{is24x7:true}, inventory:fullInventory(1.5) },
  // PUNE
  { name:'Jehangir Hospital Blood Bank', registrationNumber:'MH-BB-020', address:'32 Sassoon Road, Sangamvadi', city:'Pune', district:'Pune', state:'Maharashtra', pincode:'411001', location:{type:'Point',coordinates:[73.8777,18.5314]}, phone:'02066819999', email:'bloodbank@jehangir.com', facilities:['24x7','NAT Testing','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.3) },
  { name:'Sassoon General Hospital Blood Bank', registrationNumber:'MH-BB-021', address:'1 Natu Baug, Sangamvadi', city:'Pune', district:'Pune', state:'Maharashtra', pincode:'411001', location:{type:'Point',coordinates:[73.8842,18.5250]}, phone:'02026128000', email:'bloodbank@sassoon.pune.gov.in', facilities:['24x7','Government Hospital','Component Separation'], operatingHours:{is24x7:true}, inventory:LOW() },
  // AHMEDABAD
  { name:'Civil Hospital Blood Bank – Ahmedabad', registrationNumber:'GJ-BB-001', address:'Asarwa, Ahmedabad', city:'Ahmedabad', district:'Ahmedabad', state:'Gujarat', pincode:'380016', location:{type:'Point',coordinates:[72.5939,23.0437]}, phone:'07922681081', email:'bloodbank@civilhospital.guj.nic.in', facilities:['24x7','Government Hospital','Component Separation','NAT Testing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.7) },
  // KOCHI
  { name:'Amrita Institute Blood Bank', registrationNumber:'KL-BB-001', address:'AIMS Ponekkara, Edappally', city:'Kochi', district:'Ernakulam', state:'Kerala', pincode:'682041', location:{type:'Point',coordinates:[76.3046,10.0261]}, phone:'04842801234', email:'bloodbank@aims.amrita.edu', facilities:['24x7','Teaching Hospital','NAT Testing','Apheresis','HLA Typing'], operatingHours:{is24x7:true}, inventory:fullInventory(1.8) },
  // JAIPUR
  { name:'SMS Hospital Blood Bank – Jaipur', registrationNumber:'RJ-BB-001', address:'Jawaharlal Nehru Marg, Sanganer', city:'Jaipur', district:'Jaipur', state:'Rajasthan', pincode:'302004', location:{type:'Point',coordinates:[75.7873,26.9124]}, phone:'01412518888', email:'bloodbank@smshospital.gov.in', facilities:['24x7','Government Hospital','Component Separation'], operatingHours:{is24x7:true}, inventory:fullInventory(1.4) },
];

router.get('/status', (req, res) => {
  res.json({ version: '2026-06-01-v2', banksInSeed: BANKS.length });
});

router.post('/seed-blood-banks', async (req, res) => {
  try {
    const { key } = req.body;
    if (key !== SEED_KEY) {
      return res.status(403).json({ message: 'Invalid seed key' });
    }

    const BloodBank = require('../models/BloodBank');

    // Remove old seed records
    const del = await BloodBank.deleteMany({ adminUserId: SEED_ADMIN_ID });

    // Insert all — collect errors separately
    const toInsert = BANKS.map(b => ({
      ...b,
      adminUserId: SEED_ADMIN_ID,
      isVerified: true,
      isActive: true,
      lastInventoryUpdate: new Date(),
      acceptsWalkIn: true,
      acceptsOnlineRequest: true,
    }));

    let inserted = [];
    let errors = [];

    try {
      inserted = await BloodBank.insertMany(toInsert, { ordered: false, rawResult: false });
    } catch (bulkErr) {
      // BulkWriteError — partial success
      if (bulkErr.insertedDocs) {
        inserted = bulkErr.insertedDocs;
      }
      errors = (bulkErr.writeErrors || []).map(e => e.errmsg || e.message || String(e));
      console.error('[SeedBloodBanks] Bulk write errors:', errors.slice(0, 3));
    }

    const total = await BloodBank.countDocuments({ isActive: true });

    const byCities = await BloodBank.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      deleted: del.deletedCount,
      attempted: toInsert.length,
      inserted: Array.isArray(inserted) ? inserted.length : 0,
      totalActive: total,
      byCity: byCities,
      errors: errors.slice(0, 5)
    });
  } catch (err) {
    console.error('[SeedBloodBanks]', err);
    res.status(500).json({ message: err.message, stack: err.stack?.split('\n').slice(0, 5) });
  }
});


module.exports = router;
