require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/sequelize');
const { User, Donor, BloodBank, Donation, BloodRequest, Notification, DonorContactReveal, NoticeBoard } = require('../models');

const loadModels = () => {};

const rawBloodBanks = [
  // Hubballi-Dharwad (7 banks)
  {
    name: "Sha Damji Jadavji Chheda Memorial Rashtrotthana Blood Centre",
    shortName: "Rashtrotthana Blood Centre Hubli",
    registrationNumber: "KA-BB-DWD-001",
    phone: "0836-2215657",
    alternatePhone: "0836-2215658",
    email: "rashtrotthana.hubli@gmail.com",
    address: "D.J. Building, Neeligin Road, New Cotton Market",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580029",
    location: { type: "Point", coordinates: [75.1240, 15.3523] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 18, Aneg: 4, Bpos: 22, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 5 },
      packedRBC:        { Apos: 30, Aneg: 6, Bpos: 35, Bneg: 4, ABpos: 12, ABneg: 2, Opos: 40, Oneg: 8 },
      freshFrozenPlasma:{ Apos: 20, Aneg: 5, Bpos: 25, Bneg: 3, ABpos: 10, ABneg: 2, Opos: 30, Oneg: 6 },
      platelets:        { Apos: 15, Aneg: 2, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 20, Oneg: 3 },
      cryoprecipitate:  { Apos: 8,  Aneg: 1, Bpos: 10, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 12, Oneg: 2 },
      singleDonorPlatelets: { Apos: 5, Aneg: 1, Bpos: 6, Bneg: 1, ABpos: 2, ABneg: 0, Opos: 8, Oneg: 1 }
    },
    facilities: ["Plateletpheresis", "Component Separation", "Donor Testing", "24x7 Emergency", "FFP", "Vocational Training"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    emergencyContact: "0836-2215657",
    isVerified: true,
    isActive: true,
    rating: 4.8
  },
  {
    name: "Prema Bindu Blood Bank",
    shortName: "Prema Bindu Blood Bank",
    registrationNumber: "KA-BB-DWD-002",
    phone: "0836-2374422",
    alternatePhone: "9448134422",
    email: "premabindu.hubli@gmail.com",
    address: "Sukruth Building, Opposite KC Park Main Gate, Near Panjurli Hotel",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580008",
    location: { type: "Point", coordinates: [75.1190, 15.3612] },
    operatingHours: { is24x7: false, schedule: { monday: {open:"08:00",close:"20:00"}, tuesday: {open:"08:00",close:"20:00"}, wednesday: {open:"08:00",close:"20:00"}, thursday: {open:"08:00",close:"20:00"}, friday: {open:"08:00",close:"20:00"}, saturday: {open:"09:00",close:"18:00"}, sunday: {open:"09:00",close:"14:00"} } },
    inventory: {
      wholeBlood:       { Apos: 10, Aneg: 2, Bpos: 14, Bneg: 2, ABpos: 5, ABneg: 0, Opos: 16, Oneg: 3 },
      packedRBC:        { Apos: 20, Aneg: 3, Bpos: 25, Bneg: 2, ABpos: 8, ABneg: 1, Opos: 28, Oneg: 5 },
      freshFrozenPlasma:{ Apos: 15, Aneg: 3, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 20, Oneg: 4 },
      platelets:        { Apos: 8,  Aneg: 1, Bpos: 10, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 12, Oneg: 2 },
      cryoprecipitate:  { Apos: 4,  Aneg: 0, Bpos: 5,  Bneg: 0, ABpos: 2, ABneg: 0, Opos: 6,  Oneg: 1 },
      singleDonorPlatelets: { Apos: 3, Aneg: 0, Bpos: 4, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 5, Oneg: 0 }
    },
    facilities: ["Fresh Frozen Plasma", "Platelet Separation", "Component Separation", "Donor Testing", "Blood Donation Camps"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    emergencyContact: "9448134422",
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "Dharwad Blood Bank",
    shortName: "Dharwad Blood Bank",
    registrationNumber: "KA-BB-DWD-003",
    phone: "0836-2446892",
    alternatePhone: "9341246892",
    email: "dharwadbloodbank@gmail.com",
    address: "Station Road, Near District Hospital",
    city: "Dharwad",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580001",
    location: { type: "Point", coordinates: [75.0078, 15.4589] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 12, Aneg: 2, Bpos: 15, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 18, Oneg: 3 },
      packedRBC:        { Apos: 22, Aneg: 4, Bpos: 28, Bneg: 2, ABpos: 9, ABneg: 1, Opos: 32, Oneg: 6 },
      freshFrozenPlasma:{ Apos: 12, Aneg: 2, Bpos: 14, Bneg: 1, ABpos: 5, ABneg: 0, Opos: 18, Oneg: 3 },
      platelets:        { Apos: 6,  Aneg: 1, Bpos: 8,  Bneg: 1, ABpos: 3, ABneg: 0, Opos: 10, Oneg: 2 },
      cryoprecipitate:  { Apos: 3,  Aneg: 0, Bpos: 4,  Bneg: 0, ABpos: 1, ABneg: 0, Opos: 5,  Oneg: 1 },
      singleDonorPlatelets: { Apos: 2, Aneg: 0, Bpos: 3, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 4, Oneg: 0 }
    },
    facilities: ["24x7 Emergency", "Component Separation", "Donor Testing"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: false,
    emergencyContact: "0836-2446892",
    isVerified: true,
    isActive: true,
    rating: 4.3
  },
  {
    name: "KIMS Blood Bank Hubli",
    shortName: "KIMS Blood Bank",
    registrationNumber: "KA-BB-DWD-004",
    phone: "0836-2370000",
    alternatePhone: "0836-2370001",
    email: "bloodbank@kimshubballi.edu.in",
    address: "Vidyanagar, KIMS Hospital Campus",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580022",
    location: { type: "Point", coordinates: [75.1356, 15.3701] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 20, Aneg: 5, Bpos: 28, Bneg: 4, ABpos: 10, ABneg: 2, Opos: 35, Oneg: 7 },
      packedRBC:        { Apos: 40, Aneg: 8, Bpos: 50, Bneg: 6, ABpos: 18, ABneg: 3, Opos: 60, Oneg: 12 },
      freshFrozenPlasma:{ Apos: 30, Aneg: 6, Bpos: 38, Bneg: 5, ABpos: 14, ABneg: 2, Opos: 45, Oneg: 9 },
      platelets:        { Apos: 18, Aneg: 3, Bpos: 22, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 26, Oneg: 5 },
      cryoprecipitate:  { Apos: 10, Aneg: 2, Bpos: 12, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 15, Oneg: 3 },
      singleDonorPlatelets: { Apos: 8, Aneg: 1, Bpos: 10, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 12, Oneg: 2 }
    },
    facilities: ["Teaching Hospital", "Apheresis", "Component Separation", "24x7 Emergency", "Plateletpheresis", "Advanced Transfusion Medicine", "Donor Counseling"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    emergencyContact: "0836-2370000",
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Karnataka Cancer Therapy and Research Institute Blood Bank",
    shortName: "KCTRI Blood Bank",
    registrationNumber: "KA-BB-DWD-005",
    phone: "0836-2213600",
    alternatePhone: "0836-2213601",
    email: "bloodbank@kctrihubli.com",
    address: "Navanagar, Hubballi",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580025",
    location: { type: "Point", coordinates: [75.1089, 15.3445] },
    operatingHours: { is24x7: false, schedule: { monday: {open:"07:00",close:"21:00"}, tuesday: {open:"07:00",close:"21:00"}, wednesday: {open:"07:00",close:"21:00"}, thursday: {open:"07:00",close:"21:00"}, friday: {open:"07:00",close:"21:00"}, saturday: {open:"07:00",close:"17:00"}, sunday: {open:"09:00",close:"13:00"} } },
    inventory: {
      wholeBlood:       { Apos: 8,  Aneg: 1, Bpos: 10, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 12, Oneg: 2 },
      packedRBC:        { Apos: 15, Aneg: 2, Bpos: 20, Bneg: 2, ABpos: 7, ABneg: 1, Opos: 25, Oneg: 4 },
      freshFrozenPlasma:{ Apos: 12, Aneg: 2, Bpos: 15, Bneg: 1, ABpos: 5, ABneg: 0, Opos: 18, Oneg: 3 },
      platelets:        { Apos: 20, Aneg: 4, Bpos: 25, Bneg: 3, ABpos: 10, ABneg: 1, Opos: 30, Oneg: 5 },
      cryoprecipitate:  { Apos: 15, Aneg: 3, Bpos: 18, Bneg: 2, ABpos: 7, ABneg: 1, Opos: 22, Oneg: 4 },
      singleDonorPlatelets: { Apos: 10, Aneg: 2, Bpos: 12, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 15, Oneg: 2 }
    },
    facilities: ["Apheresis Unit", "Refrigerated Centrifuge", "-70°C Deep Freezers", "Plateletpheresis", "Hemophilia Factor Supply", "Oncology Specialized"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    emergencyContact: "0836-2213600",
    isVerified: true,
    isActive: true,
    rating: 4.9
  },
  {
    name: "Hubli Lions Blood Bank",
    shortName: "Lions Blood Bank",
    registrationNumber: "KA-BB-DWD-006",
    phone: "0836-2362525",
    alternatePhone: "9480146060",
    email: "lionshubli.bloodbank@gmail.com",
    address: "Vivekanand General Hospital Compound, Deshpande Nagar",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580029",
    location: { type: "Point", coordinates: [75.1298, 15.3581] },
    operatingHours: { is24x7: false, schedule: { monday: {open:"08:00",close:"20:00"}, tuesday: {open:"08:00",close:"20:00"}, wednesday: {open:"08:00",close:"20:00"}, thursday: {open:"08:00",close:"20:00"}, friday: {open:"08:00",close:"20:00"}, saturday: {open:"08:00",close:"18:00"}, sunday: {open:"09:00",close:"14:00"} } },
    inventory: {
      wholeBlood:       { Apos: 6,  Aneg: 1, Bpos: 8,  Bneg: 1, ABpos: 3, ABneg: 0, Opos: 10, Oneg: 2 },
      packedRBC:        { Apos: 12, Aneg: 2, Bpos: 15, Bneg: 1, ABpos: 5, ABneg: 0, Opos: 18, Oneg: 3 },
      freshFrozenPlasma:{ Apos: 8,  Aneg: 1, Bpos: 10, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 12, Oneg: 2 },
      platelets:        { Apos: 5,  Aneg: 0, Bpos: 6,  Bneg: 0, ABpos: 2, ABneg: 0, Opos: 8,  Oneg: 1 },
      cryoprecipitate:  { Apos: 2,  Aneg: 0, Bpos: 3,  Bneg: 0, ABpos: 1, ABneg: 0, Opos: 4,  Oneg: 0 },
      singleDonorPlatelets: { Apos: 1, Aneg: 0, Bpos: 2, Bneg: 0, ABpos: 0, ABneg: 0, Opos: 3, Oneg: 0 }
    },
    facilities: ["Component Separation", "Donor Testing", "Community Blood Donation Drives"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: false,
    emergencyContact: "9480146060",
    isVerified: true,
    isActive: true,
    rating: 4.2
  },
  {
    name: "Life Line 24x7 Blood Bank",
    shortName: "Life Line Blood Bank",
    registrationNumber: "KA-BB-DWD-007",
    phone: "0836-2280247",
    alternatePhone: "9886280247",
    email: "lifeline24x7.bloodbank@gmail.com",
    address: "Keshwapur, Near Bus Stand, Hubballi",
    city: "Hubballi",
    district: "Dharwad",
    state: "Karnataka",
    pincode: "580023",
    location: { type: "Point", coordinates: [75.1176, 15.3550] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 9,  Aneg: 1, Bpos: 12, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 14, Oneg: 2 },
      packedRBC:        { Apos: 18, Aneg: 2, Bpos: 22, Bneg: 2, ABpos: 7, ABneg: 1, Opos: 26, Oneg: 4 },
      freshFrozenPlasma:{ Apos: 10, Aneg: 1, Bpos: 12, Bneg: 1, ABpos: 5, ABneg: 0, Opos: 15, Oneg: 2 },
      platelets:        { Apos: 7,  Aneg: 1, Bpos: 8,  Bneg: 0, ABpos: 3, ABneg: 0, Opos: 10, Oneg: 1 },
      cryoprecipitate:  { Apos: 3,  Aneg: 0, Bpos: 4,  Bneg: 0, ABpos: 1, ABneg: 0, Opos: 5,  Oneg: 1 },
      singleDonorPlatelets: { Apos: 2, Aneg: 0, Bpos: 3, Bneg: 0, ABpos: 1, ABneg: 0, Opos: 4, Oneg: 0 }
    },
    facilities: ["24x7 Emergency", "Walk-In", "Component Separation", "Emergency Delivery"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    emergencyContact: "9886280247",
    isVerified: true,
    isActive: true,
    rating: 4.4
  },

  // Bengaluru (10 banks)
  {
    name: "Jeevadhara Blood Bank Bengaluru",
    shortName: "Jeevadhara Blood Bank",
    registrationNumber: "KA-BB-BLR-001",
    phone: "080-23456789",
    email: "jeevadhara.blr@gmail.com",
    address: "Jayanagar 4th Block, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560011",
    location: { type: "Point", coordinates: [77.5946, 12.9716] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 15, Aneg: 3, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 22, Oneg: 4 },
      packedRBC:        { Apos: 30, Aneg: 5, Bpos: 35, Bneg: 4, ABpos: 10, ABneg: 2, Opos: 40, Oneg: 6 }
    },
    facilities: ["Component Separation", "24x7 Emergency"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.5
  },
  {
    name: "Rotary Bangalore TTK Blood Bank",
    shortName: "Rotary TTK Blood Bank",
    registrationNumber: "KA-BB-BLR-002",
    phone: "080-25287903",
    email: "rotaryttk.blr@gmail.com",
    address: "Double Road, Indiranagar, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560038",
    location: { type: "Point", coordinates: [77.6321, 12.9634] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 25, Aneg: 5, Bpos: 30, Bneg: 4, ABpos: 12, ABneg: 2, Opos: 35, Oneg: 6 },
      packedRBC:        { Apos: 50, Aneg: 10, Bpos: 60, Bneg: 8, ABpos: 20, ABneg: 4, Opos: 70, Oneg: 12 }
    },
    facilities: ["Plateletpheresis", "Component Separation", "Advanced Testing"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.8
  },
  {
    name: "Red Cross Blood Bank Bengaluru",
    shortName: "Red Cross Bengaluru",
    registrationNumber: "KA-BB-BLR-003",
    phone: "080-22264205",
    email: "redcross.blr@gmail.com",
    address: "Race Course Road, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560001",
    location: { type: "Point", coordinates: [77.5802, 12.9792] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 20, Aneg: 4, Bpos: 24, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 28, Oneg: 4 }
    },
    facilities: ["Component Separation", "Emergency Mobiles"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.4
  },
  {
    name: "Sankalp India Blood Centre",
    shortName: "Sankalp Blood Centre",
    registrationNumber: "KA-BB-BLR-004",
    phone: "080-41234567",
    email: "sankalp.blr@gmail.com",
    address: "Koramangala 5th Block, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560095",
    location: { type: "Point", coordinates: [77.6101, 12.9250] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 12, Aneg: 2, Bpos: 15, Bneg: 1, ABpos: 5, ABneg: 1, Opos: 18, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "Rashtrotthana Blood Centre Bengaluru",
    shortName: "Rashtrotthana Bengaluru",
    registrationNumber: "KA-BB-BLR-005",
    phone: "080-26612730",
    email: "rashtrotthana.blr@gmail.com",
    address: "Gavipuram Guttahalli, Kempegowda Nagar, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560019",
    location: { type: "Point", coordinates: [77.5721, 12.9351] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 18, Aneg: 3, Bpos: 20, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 4 }
    },
    facilities: ["Component Separation", "Thalassemia Care", "Apheresis"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Narayana Health Blood Bank",
    shortName: "Narayana Blood Bank",
    registrationNumber: "KA-BB-BLR-006",
    phone: "080-71222222",
    email: "nh.bloodbank@narayanahealth.org",
    address: "Bommasandra Industrial Area, Anekal Taluk, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560099",
    location: { type: "Point", coordinates: [77.6925, 12.8123] },
    operatingHours: { is24x7: true },
    inventory: {
      packedRBC:        { Apos: 40, Aneg: 8, Bpos: 45, Bneg: 6, ABpos: 15, ABneg: 3, Opos: 50, Oneg: 8 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "MS Ramaiah Memorial Blood Bank",
    shortName: "Ramaiah Blood Bank",
    registrationNumber: "KA-BB-BLR-007",
    phone: "080-23608888",
    email: "ramaiah.bloodbank@msr.edu",
    address: "MSRIT Post, MSR Nagar, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560054",
    location: { type: "Point", coordinates: [77.5682, 13.0305] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 14, Aneg: 2, Bpos: 16, Bneg: 2, ABpos: 5, ABneg: 0, Opos: 20, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.5
  },
  {
    name: "St. John's Medical College Hospital Blood Bank",
    shortName: "St. John's Blood Bank",
    registrationNumber: "KA-BB-BLR-008",
    phone: "080-22065000",
    email: "stjohns.blood@stjohns.in",
    address: "Sarjapur Road, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560034",
    location: { type: "Point", coordinates: [77.6242, 12.9332] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 30, Aneg: 6, Bpos: 35, Bneg: 5, ABpos: 14, ABneg: 2, Opos: 40, Oneg: 7 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Manipal Hospital Blood Bank",
    shortName: "Manipal Blood Bank",
    registrationNumber: "KA-BB-BLR-009",
    phone: "080-25024444",
    email: "manipal.blood@manipalhospitals.com",
    address: "HAL Old Airport Road, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560017",
    location: { type: "Point", coordinates: [77.6433, 12.9592] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 22, Aneg: 4, Bpos: 26, Bneg: 3, ABpos: 10, ABneg: 1, Opos: 28, Oneg: 5 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "Fortis Hospital Blood Center",
    shortName: "Fortis Blood Center",
    registrationNumber: "KA-BB-BLR-010",
    phone: "080-66214444",
    email: "fortis.blood@fortishealthcare.com",
    address: "Bannerghatta Road, Opp IIMB, Bengaluru",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560076",
    location: { type: "Point", coordinates: [77.5992, 12.8953] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 12, Aneg: 2, Bpos: 14, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 16, Oneg: 2 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.4
  },

  // Hyderabad (10 banks)
  {
    name: "Chiranjeevi Charitable Blood Bank",
    shortName: "Chiranjeevi Blood Bank",
    registrationNumber: "TS-BB-HYD-001",
    phone: "040-23555055",
    email: "chiranjeevi.bloodbank@gmail.com",
    address: "Road No. 1, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    location: { type: "Point", coordinates: [78.4310, 17.4225] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 40, Aneg: 8, Bpos: 45, Bneg: 6, ABpos: 16, ABneg: 3, Opos: 50, Oneg: 10 },
      packedRBC:        { Apos: 60, Aneg: 12, Bpos: 70, Bneg: 10, ABpos: 24, ABneg: 5, Opos: 80, Oneg: 15 }
    },
    facilities: ["Component Separation", "Apheresis", "Thalassemia Care", "24x7 Service"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.9
  },
  {
    name: "Red Cross Blood Bank Hyderabad",
    shortName: "Red Cross Hyderabad",
    registrationNumber: "TS-BB-HYD-002",
    phone: "040-23390234",
    email: "redcross.hyd@gmail.com",
    address: "Vidyanagar, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500044",
    location: { type: "Point", coordinates: [78.4802, 17.4012] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 25, Aneg: 4, Bpos: 28, Bneg: 3, ABpos: 10, ABneg: 2, Opos: 32, Oneg: 5 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.5
  },
  {
    name: "Aarohi Blood Bank",
    shortName: "Aarohi Blood Bank",
    registrationNumber: "TS-BB-HYD-003",
    phone: "040-23226274",
    email: "aarohi.blood@gmail.com",
    address: "Filmnagar, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500096",
    location: { type: "Point", coordinates: [78.4485, 17.4356] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 15, Aneg: 2, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 22, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "NTR Trust Blood Bank",
    shortName: "NTR Trust Blood Bank",
    registrationNumber: "TS-BB-HYD-004",
    phone: "040-48577888",
    email: "ntrtrust.blood@gmail.com",
    address: "Road No 2, Banjara Hills, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500034",
    location: { type: "Point", coordinates: [78.4285, 17.4241] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 30, Aneg: 6, Bpos: 35, Bneg: 5, ABpos: 12, ABneg: 2, Opos: 40, Oneg: 8 }
    },
    facilities: ["Plateletpheresis", "Component Separation", "Free Thalassemia Blood Supply"],
    acceptsWalkIn: true,
    acceptsOnlineRequest: true,
    isVerified: true,
    isActive: true,
    rating: 4.8
  },
  {
    name: "Gandhian Blood Center",
    shortName: "Gandhian Blood Center",
    registrationNumber: "TS-BB-HYD-005",
    phone: "040-23445566",
    email: "gandhian.blood@gmail.com",
    address: "Malakpet, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500036",
    location: { type: "Point", coordinates: [78.4901, 17.3660] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 10, Aneg: 1, Bpos: 12, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 15, Oneg: 2 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.3
  },
  {
    name: "Osmania General Hospital Blood Bank",
    shortName: "Osmania Blood Bank",
    registrationNumber: "TS-BB-HYD-006",
    phone: "040-24600146",
    email: "osmania.blood@gmail.com",
    address: "Afzal Gunj, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500012",
    location: { type: "Point", coordinates: [78.4721, 17.3785] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 20, Aneg: 4, Bpos: 22, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 4 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.5
  },
  {
    name: "NIMS Hospital Blood Bank",
    shortName: "NIMS Blood Bank",
    registrationNumber: "TS-BB-HYD-007",
    phone: "040-23389000",
    email: "nims.bloodbank@nims.edu.in",
    address: "Punjagutta, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500082",
    location: { type: "Point", coordinates: [78.4556, 17.4182] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 18, Aneg: 3, Bpos: 20, Bneg: 2, ABpos: 7, ABneg: 1, Opos: 22, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "Apollo Hospitals Blood Bank Hyderabad",
    shortName: "Apollo Blood Bank",
    registrationNumber: "TS-BB-HYD-008",
    phone: "040-23607777",
    email: "apollo.bloodhyd@apollo.com",
    address: "Road No 10, Jubilee Hills, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    location: { type: "Point", coordinates: [78.4112, 17.4154] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 25, Aneg: 5, Bpos: 28, Bneg: 4, ABpos: 10, ABneg: 2, Opos: 30, Oneg: 5 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Secunderabad Red Cross Blood Bank",
    shortName: "Secunderabad Red Cross",
    registrationNumber: "TS-BB-HYD-009",
    phone: "040-27801234",
    email: "secredcross@gmail.com",
    address: "James Street, Secunderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500003",
    location: { type: "Point", coordinates: [78.4890, 17.4430] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 14, Aneg: 2, Bpos: 16, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 18, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.4
  },
  {
    name: "Yashoda Hospital Blood Bank",
    shortName: "Yashoda Blood Bank",
    registrationNumber: "TS-BB-HYD-010",
    phone: "040-45674567",
    email: "yashoda.blood@yashodahospitals.com",
    address: "Raj Bhavan Road, Somajiguda, Hyderabad",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500082",
    location: { type: "Point", coordinates: [78.4590, 17.4210] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 20, Aneg: 4, Bpos: 24, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 4 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },

  // Visakhapatnam (4 banks)
  {
    name: "AS Raja Voluntary Blood Bank",
    shortName: "AS Raja Blood Bank",
    registrationNumber: "AP-BB-VZP-001",
    phone: "0891-2555660",
    email: "asraja.vsp@gmail.com",
    address: "MVP Colony, Visakhapatnam",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincode: "530017",
    location: { type: "Point", coordinates: [83.3082, 17.7214] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 18, Aneg: 3, Bpos: 20, Bneg: 2, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 4 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Rotary Blood Bank Vizag",
    shortName: "Rotary Vizag",
    registrationNumber: "AP-BB-VZP-002",
    phone: "0891-2748888",
    email: "rotaryvizag@gmail.com",
    address: "Ramnagar, Visakhapatnam",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincode: "530002",
    location: { type: "Point", coordinates: [83.2985, 17.7123] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 15, Aneg: 2, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 20, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "NTR Trust Blood Bank Vizag",
    shortName: "NTR Trust Vizag",
    registrationNumber: "AP-BB-VZP-003",
    phone: "0891-2508899",
    email: "ntrvizag@gmail.com",
    address: "Seethammadhara, Visakhapatnam",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincode: "530013",
    location: { type: "Point", coordinates: [83.3021, 17.7198] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 22, Aneg: 4, Bpos: 25, Bneg: 3, ABpos: 9, ABneg: 1, Opos: 30, Oneg: 5 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.8
  },
  {
    name: "King George Hospital Blood Bank",
    shortName: "KGH Blood Bank",
    registrationNumber: "AP-BB-VZP-004",
    phone: "0891-2564891",
    email: "kgh.bloodbank@gmail.com",
    address: "Maharanipeta, Visakhapatnam",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincode: "530002",
    location: { type: "Point", coordinates: [83.3034, 17.7051] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 25, Aneg: 5, Bpos: 28, Bneg: 4, ABpos: 10, ABneg: 2, Opos: 35, Oneg: 6 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.5
  },

  // Vijayawada (3 banks)
  {
    name: "Red Cross Blood Bank Vijayawada",
    shortName: "Red Cross Vijayawada",
    registrationNumber: "AP-BB-VJW-001",
    phone: "0866-2433942",
    email: "redcross.vjw@gmail.com",
    address: "Governorpet, Vijayawada",
    city: "Vijayawada",
    district: "Krishna",
    state: "Andhra Pradesh",
    pincode: "520002",
    location: { type: "Point", coordinates: [80.6480, 16.5062] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 20, Aneg: 4, Bpos: 22, Bneg: 3, ABpos: 8, ABneg: 1, Opos: 25, Oneg: 4 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "NTR Trust Blood Bank Vijayawada",
    shortName: "NTR Trust Vijayawada",
    registrationNumber: "AP-BB-VJW-002",
    phone: "0866-2488889",
    email: "ntrvjw@gmail.com",
    address: "Labbipet, Vijayawada",
    city: "Vijayawada",
    district: "Krishna",
    state: "Andhra Pradesh",
    pincode: "520010",
    location: { type: "Point", coordinates: [80.6212, 16.5185] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 18, Aneg: 3, Bpos: 20, Bneg: 2, ABpos: 7, ABneg: 1, Opos: 22, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.7
  },
  {
    name: "Ayush Hospitals Blood Bank",
    shortName: "Ayush Blood Bank",
    registrationNumber: "AP-BB-VJW-003",
    phone: "0866-6635555",
    email: "ayush.blood@ayushhospitals.com",
    address: "Ring Road, Vijayawada",
    city: "Vijayawada",
    district: "Krishna",
    state: "Andhra Pradesh",
    pincode: "520008",
    location: { type: "Point", coordinates: [80.6651, 16.4982] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 12, Aneg: 2, Bpos: 15, Bneg: 1, ABpos: 4, ABneg: 0, Opos: 16, Oneg: 2 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.4
  },

  // Guntur (3 banks)
  {
    name: "Red Cross Blood Bank Guntur",
    shortName: "Red Cross Guntur",
    registrationNumber: "AP-BB-GTR-001",
    phone: "0863-2224555",
    email: "redcross.gtr@gmail.com",
    address: "Kothapet, Guntur",
    city: "Guntur",
    district: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522001",
    location: { type: "Point", coordinates: [80.4365, 16.3067] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 15, Aneg: 3, Bpos: 18, Bneg: 2, ABpos: 6, ABneg: 1, Opos: 20, Oneg: 3 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.5
  },
  {
    name: "GGH Guntur Blood Bank",
    shortName: "GGH Blood Bank",
    registrationNumber: "AP-BB-GTR-002",
    phone: "0863-2233881",
    email: "gghguntur.bloodbank@gmail.com",
    address: "Government General Hospital Campus, Guntur",
    city: "Guntur",
    district: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522001",
    location: { type: "Point", coordinates: [80.4421, 16.3012] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 30, Aneg: 6, Bpos: 35, Bneg: 5, ABpos: 12, ABneg: 2, Opos: 40, Oneg: 7 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.6
  },
  {
    name: "NTR Trust Blood Bank Guntur",
    shortName: "NTR Trust Guntur",
    registrationNumber: "AP-BB-GTR-003",
    phone: "0863-2339999",
    email: "ntrgtr@gmail.com",
    address: "Arundelpet, Guntur",
    city: "Guntur",
    district: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522002",
    location: { type: "Point", coordinates: [80.4501, 16.3150] },
    operatingHours: { is24x7: true },
    inventory: {
      wholeBlood:       { Apos: 14, Aneg: 2, Bpos: 16, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 18, Oneg: 2 }
    },
    isVerified: true,
    isActive: true,
    rating: 4.4
  }
];

const citiesList = [
  { name: "Bengaluru", state: "Karnataka", center: [77.5946, 12.9716], count: 40 },
  { name: "Hubballi", state: "Karnataka", center: [75.1240, 15.3647], count: 15 },
  { name: "Dharwad", state: "Karnataka", center: [75.0078, 15.4589], count: 15 },
  { name: "Hyderabad", state: "Telangana", center: [78.4867, 17.3850], count: 40 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", center: [83.2185, 17.6868], count: 15 },
  { name: "Vijayawada", state: "Andhra Pradesh", center: [80.6480, 16.5062], count: 15 },
  { name: "Guntur", state: "Andhra Pradesh", center: [80.4365, 16.3067], count: 10 }
];

const firstNames = [
  'Amit', 'Sunil', 'Vijay', 'Rahul', 'Priya', 'Kiran', 'Deepa', 'Sandeep', 'Neha', 'Ganesh',
  'Ramesh', 'Kartik', 'Ananya', 'Sneha', 'Mahesh', 'Rajesh', 'Vikas', 'Chethan', 'Varun', 'Kavitha',
  'Abhishek', 'Shruti', 'Preethi', 'Manoj', 'Naveen', 'Vikram', 'Prakash', 'Sanjay', 'Harish', 'Sachin',
  'Aditya', 'Divya', 'Prasad', 'Rohan', 'Swati', 'Anjali', 'Arjun', 'Sai', 'Krishna', 'Kalyan',
  'Ravi', 'Srinivas', 'Lakshmi', 'Nikhil', 'Pavan', 'Raju', 'Satish', 'Suresh', 'Babu', 'Prashanth',
  'Gautam', 'Karan', 'Meera', 'Pooja', 'Shreya', 'Tarun', 'Yash', 'Ritu', 'Simran', 'Alok'
];

const lastNames = [
  'Patil', 'Shetty', 'Joshi', 'Bhat', 'Desai', 'Kulkarni', 'Naik', 'Gowda', 'Hegde', 'Kamath',
  'Reddy', 'Hiremath', 'Angadi', 'Shettar', 'More', 'Chougule', 'Nagaraj', 'Shastry', 'Venkatesh', 'Babu',
  'Bhandari', 'Siddiqui', 'Khan', 'Kumar', 'Singh', 'Sharma', 'Gupta', 'Rao', 'Pai', 'Verma',
  'Choudhary', 'Chawla', 'Mehta', 'Grover', 'Kapoor', 'Khanna', 'Malhotra', 'Sari', 'Joshi', 'Nair',
  'Pillai', 'Menon', 'Balakrishnan', 'Iyer', 'Iyengar', 'Sastry', 'Rao', 'Prasad', 'Naidu', 'Chowdary',
  'Varma', 'Raju', 'Somayaji', 'Vasisht', 'Acharya', 'Trivedi', 'Pandey', 'Dubey', 'Mishra', 'Pathak'
];

// Exact demographic distribution for 150 blood groups:
// O+ (35% -> 53), O- (5% -> 7), A+ (20% -> 30), A- (5% -> 8), B+ (25% -> 37), B- (5% -> 8), AB+ (4% -> 6), AB- (1% -> 1)
const generateBloodGroups = () => {
  const list = [];
  for (let i = 0; i < 53; i++) list.push('O+');
  for (let i = 0; i < 7;  i++) list.push('O-');
  for (let i = 0; i < 30; i++) list.push('A+');
  for (let i = 0; i < 8;  i++) list.push('A-');
  for (let i = 0; i < 37; i++) list.push('B+');
  for (let i = 0; i < 8;  i++) list.push('B-');
  for (let i = 0; i < 6;  i++) list.push('AB+');
  for (let i = 0; i < 1;  i++) list.push('AB-');
  
  // Shuffle array using Fisher-Yates
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const seedData = async () => {
  try {
    // Force sync drops and Recreates all SQLite tables
    await sequelize.sync({ force: true });
    console.log('🧹 Cleaned existing database records by syncing schema');

    // 2. Create base user accounts passwords
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const donorPasswordHash = await bcrypt.hash('Donor@123', 10);
    const bankPasswordHash = await bcrypt.hash('Bank@123', 10);
    const patientPasswordHash = await bcrypt.hash('Patient@123', 10);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generatedIds = new Set(['OB-ADM1N1', 'OB-D0N0R1', 'OB-BANK01', 'OB-PAT001']);
    const generateOneBloodId = () => {
      let id;
      do {
        const suffix = Array.from({ length: 6 }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join('');
        id = `OB-${suffix}`;
      } while (generatedIds.has(id));
      generatedIds.add(id);
      return id;
    };

    // Create System Users
    const superAdmin = await User.create({
      onebloodId: 'OB-ADM1N1',
      name: 'Platform Administrator',
      email: 'admin@oneblood.in',
      phone: '+919999999999',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isVerified: true
    });

    const sampleDonorUser = await User.create({
      onebloodId: 'OB-D0N0R1',
      name: 'Arun Kumar',
      email: 'donor@oneblood.in',
      phone: '+919876543210',
      passwordHash: donorPasswordHash,
      role: 'donor',
      donorProfileComplete: true,
      isVerified: true
    });

    const rashtrotthanaAdmin = await User.create({
      onebloodId: 'OB-BANK01',
      name: 'Rashtrotthana Blood Bank Admin',
      email: 'bank@rashtrotthana.in',
      phone: '08362215657',
      passwordHash: bankPasswordHash,
      role: 'blood_bank',
      bankProfileComplete: true,
      isVerified: true
    });

    const samplePatient = await User.create({
      onebloodId: 'OB-PAT001',
      name: 'Suresh Patil',
      email: 'patient@oneblood.in',
      phone: '+919988776655',
      passwordHash: patientPasswordHash,
      role: 'patient',
      isVerified: true
    });

    console.log('👤 Root user accounts created');

    // Create a Donor profile for the sample donor user (B+ blood group)
    const sampleDonorProfile = await Donor.create({
      userId: sampleDonorUser._id,
      name: sampleDonorUser.name,
      bloodGroup: 'B+',
      age: 28,
      weight: 72,
      gender: 'male',
      phone: sampleDonorUser.phone,
      email: sampleDonorUser.email,
      address: 'Gokul Road, Hubballi',
      city: 'Hubballi',
      pincode: '580030',
      location: {
        type: 'Point',
        coordinates: [75.1240, 15.3647] // Hubli Center
      },
      isAvailable: true,
      eligibleToDonateSince: new Date(),
      totalDonations: 4,
      medicalConditions: [],
      badges: ['First Drop', 'Life Saver']
    });
    console.log('💉 Sample donor profile registered');

    // 3. Seed Blood Banks
    for (let i = 0; i < rawBloodBanks.length; i++) {
      const bankData = rawBloodBanks[i];
      let adminId;

      if (i === 0) {
        // Link Rashtrotthana to the dedicated user account
        adminId = rashtrotthanaAdmin._id;
      } else {
        // Generate separate sub-admin users for others
        const subAdminUser = await User.create({
          onebloodId: generateOneBloodId(),
          name: `${bankData.shortName || bankData.name} Administrator`,
          email: `admin${i}@oneblood.in`,
          phone: bankData.phone,
          passwordHash: bankPasswordHash,
          role: 'blood_bank',
          bankProfileComplete: true,
          isVerified: true
        });
        adminId = subAdminUser._id;
      }

      await BloodBank.create({
        ...bankData,
        adminUserId: adminId
      });
    }
    console.log(`🏢 Seeded ${rawBloodBanks.length} Blood Banks across South India`);

    // 4. Seed 150 Donors with exact group distributions
    const bloodGroups = generateBloodGroups(); // Array of 150 items
    let donorIndex = 0;

    for (const city of citiesList) {
      for (let j = 0; j < city.count; j++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const donorName = `${firstName} ${lastName}`;
        const donorEmail = `donor_${donorIndex + 1}@oneblood.in`;
        const donorPhone = `+91${['9', '8', '7', '6'][Math.floor(Math.random() * 4)]}${Math.floor(100000000 + Math.random() * 900000000)}`;

        // Create User credential
        const subDonorUser = await User.create({
          onebloodId: generateOneBloodId(),
          name: donorName,
          email: donorEmail,
          phone: donorPhone,
          passwordHash: donorPasswordHash,
          role: 'donor',
          donorProfileComplete: true,
          isVerified: true
        });

        // Geo variance ±0.08 degrees around city center coordinates
        const randomLngOffset = (Math.random() - 0.5) * 0.16;
        const randomLatOffset = (Math.random() - 0.5) * 0.16;

        const lastDonationDaysAgo = Math.floor(Math.random() * 200); // 0 to 200 days ago
        const lastDonated = lastDonationDaysAgo > 60 ? new Date(Date.now() - lastDonationDaysAgo * 24 * 60 * 60 * 1000) : null;
        
        const eligibleSince = new Date();
        if (lastDonated) {
          eligibleSince.setTime(lastDonated.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days deferral
        }

        const isAvailable = Math.random() < 0.70; // 70% available

        await Donor.create({
          userId: subDonorUser._id,
          name: donorName,
          bloodGroup: bloodGroups[donorIndex],
          age: Math.floor(18 + Math.random() * 42),
          weight: Math.floor(52 + Math.random() * 40),
          gender: Math.random() < 0.6 ? 'male' : (Math.random() < 0.9 ? 'female' : 'other'),
          phone: donorPhone,
          email: donorEmail,
          address: `Road No. ${j + 1}, ${city.name}`,
          city: city.name,
          pincode: `5800${Math.floor(10 + Math.random() * 20)}`,
          location: {
            type: 'Point',
            coordinates: [city.center[0] + randomLngOffset, city.center[1] + randomLatOffset]
          },
          isAvailable,
          lastDonated,
          eligibleToDonateSince: eligibleSince,
          totalDonations: Math.floor(Math.random() * 10),
          badges: Math.random() > 0.6 ? ['First Drop'] : (Math.random() > 0.8 ? ['Life Saver', 'Frequent Donor'] : []),
          medicalConditions: Math.random() > 0.95 ? ['Mild Hypertension'] : [],
          preferredContactMethod: ['call', 'whatsapp', 'email'][Math.floor(Math.random() * 3)]
        });

        donorIndex++;
      }
    }

    console.log(`💉 Seeded ${donorIndex} random donors with exact blood group distributions`);

    // 5. Seed NoticeBoard entries
    const samplePatientUser = await User.findOne({ where: { email: 'patient@oneblood.in' } });
    if (samplePatientUser) {
      await NoticeBoard.bulkCreate([
        {
          seekerId: samplePatientUser._id,
          seekerName: samplePatientUser.name,
          patientName: 'Ramesh Patil',
          bloodGroup: 'O+',
          component: 'Whole Blood',
          unitsNeeded: 3,
          hospital: 'KIMS Hospital Campus',
          city: 'Hubballi',
          contactNumber: '+919988776655',
          urgency: 'critical',
          message: 'Urgent whole blood required for cardiac surgery tomorrow morning. Please help.',
          status: 'open',
          responses: []
        },
        {
          seekerId: samplePatientUser._id,
          seekerName: samplePatientUser.name,
          patientName: 'Priya Hegde',
          bloodGroup: 'B-',
          component: 'Platelets',
          unitsNeeded: 2,
          hospital: 'SDM College of Medical Sciences',
          city: 'Dharwad',
          contactNumber: '+919988776655',
          urgency: 'urgent',
          message: 'Patient is undergoing chemotherapy and needs platelets matching B negative. Contact immediately.',
          status: 'open',
          responses: []
        },
        {
          seekerId: samplePatientUser._id,
          seekerName: samplePatientUser.name,
          patientName: 'Anil Kumar',
          bloodGroup: 'A+',
          component: 'Plasma',
          unitsNeeded: 1,
          hospital: 'Tatwadarsha Hospital',
          city: 'Hubballi',
          contactNumber: '+919988776655',
          urgency: 'moderate',
          message: 'Stable but plasma required for medical procedure scheduled in 2 days.',
          status: 'open',
          responses: []
        }
      ]);
      console.log('📋 Seeded sample NoticeBoard entries');
    }

    console.log('✅ Seeding completed successfully!');
    await sequelize.close();
    
  } catch (error) {
    console.error('🔴 Seeding Error:', error.message);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  }
};

seedData();
