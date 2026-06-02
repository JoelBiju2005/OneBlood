const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User');
const DonationMatch = require('../models/DonationMatch');
const { uploadFile } = require('../services/storageService');

const getProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }
    res.status(200).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { hospitalName, registrationNumber, hospitalType, address, city, state, pincode, emergencyContact, website, authorizedPersonName, designation, lat, lng } = req.body;
    
    let hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    if (hospitalName) hospital.hospitalName = hospitalName;
    if (registrationNumber) hospital.registrationNumber = registrationNumber;
    if (hospitalType) hospital.hospitalType = hospitalType;
    if (address) hospital.address = address;
    if (city) hospital.city = city;
    if (state) hospital.state = state;
    if (pincode) hospital.pincode = pincode;
    if (emergencyContact) hospital.emergencyContact = emergencyContact;
    if (website !== undefined) hospital.website = website;
    if (authorizedPersonName) hospital.authorizedPersonName = authorizedPersonName;
    if (designation) hospital.designation = designation;

    if (lat && lng) {
      hospital.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    await hospital.save();
    res.status(200).json({ success: true, message: 'Hospital profile updated successfully', hospital });
  } catch (error) {
    next(error);
  }
};

const uploadDocs = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    if (req.files) {
      if (req.files.registrationCertificate) {
        const fileUrl = await uploadFile(req.files.registrationCertificate[0]);
        hospital.documents.registrationCertificate = fileUrl;
      }
      if (req.files.govApproval) {
        const fileUrl = await uploadFile(req.files.govApproval[0]);
        hospital.documents.govApproval = fileUrl;
      }
      hospital.markModified('documents');
      await hospital.save();
    }

    res.status(200).json({ success: true, message: 'Documents uploaded successfully', documents: hospital.documents });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const matchesInProgress = await DonationMatch.countDocuments({ hospitalId: hospital._id, status: 'in_progress' });
    const matchesCompleted = await DonationMatch.countDocuments({ hospitalId: hospital._id, status: 'completed' });

    res.status(200).json({
      success: true,
      stats: {
        verificationStatus: hospital.verificationStatus,
        matchesInProgress,
        matchesCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns a combined list of verified Facilities (Hospitals & Blood Banks) for seeker drop-downs.
 */
const getApprovedFacilities = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find({ verificationStatus: 'approved' });
    const bloodBanks = await BloodBank.find({ verificationStatus: 'approved' });

    const facilities = [
      ...hospitals.map(h => ({
        id: h._id,
        name: h.hospitalName,
        type: 'Hospital',
        address: h.address,
        city: h.city,
        phone: h.emergencyContact,
        location: h.location
      })),
      ...bloodBanks.map(b => ({
        id: b._id,
        name: b.name,
        type: 'BloodBank',
        address: b.address,
        city: b.city,
        phone: b.phone || b.email,
        location: b.location
      }))
    ];

    res.status(200).json({ success: true, count: facilities.length, facilities });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadDocs,
  getDashboardStats,
  getApprovedFacilities
};
