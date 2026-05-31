const Donor = require('../models/Donor');
const User = require('../models/User');
const Donation = require('../models/Donation');
const BloodRequest = require('../models/BloodRequest');
const DonorContactReveal = require('../models/DonorContactReveal');

const registerDonor = async (req, res, next) => {
  try {
    const {
      bloodGroup,
      age,
      weight,
      gender,
      address,
      city,
      pincode,
      lat,
      lng,
      medicalConditions,
      preferredContactMethod,
      bio,
      lastDonated,
    } = req.body;

    const userId = req.user._id;

    // Check if user already has a donor profile
    let donor = await Donor.findOne({ userId });
    
    const donorData = {
      userId,
      name: req.user.name,
      bloodGroup,
      age: parseInt(age, 10),
      weight: parseInt(weight, 10),
      gender,
      phone: req.user.phone,
      email: req.user.email,
      address,
      city,
      pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // [longitude, latitude]
      },
      bio: bio || '',
      medicalConditions: medicalConditions ? (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions]) : [],
      preferredContactMethod: preferredContactMethod || 'call',
      lastDonated: lastDonated || null,
      isAvailable: true,
      eligibleToDonateSince: lastDonated ? new Date(new Date(lastDonated).getTime() + 90 * 24 * 60 * 60 * 1000) : new Date(),
    };

    if (donor) {
      // Update existing donor profile
      donor = await Donor.findOneAndUpdate({ userId }, donorData, { new: true });
      await User.findByIdAndUpdate(userId, { role: 'donor', donorProfileComplete: true });
    } else {
      // Create new donor profile
      donorData.totalDonations = 0;
      donorData.rating = 5.0;
      donorData.badges = [];
      donor = await Donor.create(donorData);
      // Update user role to donor
      await User.findByIdAndUpdate(userId, { role: 'donor', donorProfileComplete: true });
    }

    res.status(201).json({
      message: 'Donor profile saved successfully',
      donor,
    });
  } catch (error) {
    next(error);
  }
};

const getDonors = async (req, res, next) => {
  try {
    const { bloodGroup, lat, lng, radius, available } = req.query;
    const query = {};

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (available !== undefined) {
      query.isAvailable = available === 'true';
    } else {
      query.isAvailable = true; // Default to showing active donors
    }

    if (lat && lng) {
      const rad = parseFloat(radius) || 10; // radius in km, fallback 10km
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: rad * 1000, // to meters
        },
      };
    }

    // Donor privacy: Hide direct contact details in list results
    const donors = await Donor.find(query).select('-phone -email -idProof -donationHistory -reviews');

    res.status(200).json({
      count: donors.length,
      donors,
    });
  } catch (error) {
    next(error);
  }
};

const getDonorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id).populate('donationHistory').populate('userId', 'onebloodId');

    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const isOwner = req.user && req.user._id.toString() === donor.userId._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (isOwner || isAdmin) {
      const donorObj = donor.toObject();
      if (donorObj.userId && donorObj.userId.onebloodId) {
        donorObj.onebloodId = donorObj.userId.onebloodId;
      }
      return res.status(200).json({ donor: donorObj });
    }

    // Public view (strips contact details)
    const publicDonor = donor.toObject();
    if (publicDonor.userId && publicDonor.userId.onebloodId) {
      publicDonor.onebloodId = publicDonor.userId.onebloodId;
    }
    delete publicDonor.phone;
    delete publicDonor.email;
    delete publicDonor.idProof;

    res.status(200).json({ donor: publicDonor });
  } catch (error) {
    next(error);
  }
};

const getDonorProfilePublic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id)
      .select('-phone -email -idProof -donationHistory -reviews')
      .populate('userId', 'onebloodId');
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    const donorObj = donor.toObject();
    if (donorObj.userId && donorObj.userId.onebloodId) {
      donorObj.onebloodId = donorObj.userId.onebloodId;
    }
    res.status(200).json({ donor: donorObj });
  } catch (error) {
    next(error);
  }
};

const getDonorContact = async (req, res, next) => {
  try {
    const { id } = req.params; // Donor ID
    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check if the requester has a request that this donor has accepted
    const matchedRequest = await BloodRequest.findOne({
      requesterId: req.user._id,
      responses: {
        $elemMatch: {
          responderId: donor._id,
          responderType: 'donor',
          status: 'accepted'
        }
      }
    });

    // Or check if contact is revealed in DonorContactReveal
    const revealLog = await DonorContactReveal.findOne({
      donorId: donor._id,
      unlockedFor: req.user._id
    });

    const isOwner = req.user._id.toString() === donor.userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (matchedRequest || revealLog || isOwner || isAdmin) {
      return res.status(200).json({
        success: true,
        phone: donor.phone,
        email: donor.email,
        address: donor.address,
        name: donor.name
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Donor contact details are locked until the donor accepts your request.'
    });
  } catch (error) {
    next(error);
  }
};

const unlockDonorContact = async (req, res, next) => {
  try {
    const { id } = req.params; // Donor ID
    const { requestId } = req.body;

    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    await DonorContactReveal.findOneAndUpdate(
      { requestId, donorId: id, unlockedFor: req.user._id },
      { revealedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Donor contact details unlocked successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    let donor = await Donor.findById(id);

    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    if (req.user._id.toString() !== donor.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }

    const updates = req.body;
    if (updates.lat && updates.lng) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(updates.lng), parseFloat(updates.lat)],
      };
    }
    if (updates.lastDonated !== undefined) {
      updates.eligibleToDonateSince = updates.lastDonated ? new Date(new Date(updates.lastDonated).getTime() + 90 * 24 * 60 * 60 * 1000) : new Date();
    }

    donor = await Donor.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ message: 'Donor profile updated successfully', donor });
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    let donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    if (req.user._id.toString() !== donor.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    donor.isAvailable = isAvailable;
    await donor.save();

    res.status(200).json({ message: 'Availability status updated', isAvailable: donor.isAvailable });
  } catch (error) {
    next(error);
  }
};

const getDonorHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const history = await Donation.find({ donorId: id }).populate('bloodBankId', 'name address phone');
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
};

const getDonorProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    res.status(200).json({ donor });
  } catch (error) {
    next(error);
  }
};

const updateAvailabilitySelf = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    donor.isAvailable = isAvailable;
    await donor.save();
    res.status(200).json({ message: 'Availability status updated', isAvailable: donor.isAvailable });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDonor,
  getDonors,
  getDonorById,
  updateDonor,
  updateAvailability,
  getDonorHistory,
  getDonorProfile,
  updateAvailabilitySelf,
  getDonorProfilePublic,
  getDonorContact,
  unlockDonorContact,
};
