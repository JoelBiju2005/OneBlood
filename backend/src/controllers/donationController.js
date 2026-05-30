const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const socketService = require('../services/socketService');

const createDonation = async (req, res, next) => {
  try {
    const { donorId, bloodBankId, bloodRequestId, donationDate, bloodGroup, component, units, certificate } = req.body;

    // Validate donor exists
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Validate bank exists
    const bank = await BloodBank.findById(bloodBankId);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    const qty = parseInt(units, 10) || 1;
    const dDate = donationDate ? new Date(donationDate) : new Date();

    // 1. Create Donation Record
    const donation = await Donation.create({
      donorId,
      bloodBankId,
      bloodRequestId: bloodRequestId || null,
      donationDate: dDate,
      bloodGroup,
      component,
      units: qty,
      certificate: certificate || ''
    });

    // 2. Update Donor Profile eligibility and counts
    donor.lastDonated = dDate;
    
    // waiting period calculations: 56 days for whole blood/prbc, 7 days for platelets
    const waitingDays = (component === 'platelets' || component === 'sdp') ? 7 : 56;
    const nextEligible = new Date(dDate);
    nextEligible.setDate(nextEligible.getDate() + waitingDays);
    donor.eligibleToDonateSince = nextEligible;
    
    donor.totalDonations += 1;
    donor.donationHistory.push(donation._id);
    
    // Add point system gamification
    let pointsAwarded = 100;
    if (bloodRequestId) pointsAwarded += 50; // extra points for patient matching
    donor.badges = donor.badges || [];
    
    if (donor.totalDonations === 1 && !donor.badges.includes('First Drop')) {
      donor.badges.push('First Drop');
    }
    if (donor.totalDonations >= 3 && !donor.badges.includes('Life Saver')) {
      donor.badges.push('Life Saver');
    }
    if (donor.totalDonations >= 5 && !donor.badges.includes('Emergency Hero')) {
      donor.badges.push('Emergency Hero');
    }

    await donor.save();

    // 3. Increment the blood bank's inventory automatically
    const mapper = {
      'whole_blood': 'wholeBlood',
      'prbc': 'packedRBC',
      'plasma': 'freshFrozenPlasma',
      'platelets': 'platelets',
      'cryoprecipitate': 'cryoprecipitate',
      'sdp': 'singleDonorPlatelets'
    };
    const compKey = mapper[component.toLowerCase()] || component;
    const bgKey = bloodGroup.toUpperCase().replace('+', 'pos').replace('-', 'neg');

    if (bank.inventory && bank.inventory[compKey] && bank.inventory[compKey][bgKey] !== undefined) {
      bank.inventory[compKey][bgKey] += qty;
      bank.lastInventoryUpdate = new Date();
      await bank.save();

      // Broadcast inventory updates
      socketService.broadcastToAll('inventory_updated', {
        bankId: bank._id,
        name: bank.name,
        location: bank.location,
        inventory: bank.inventory
      });
    }

    res.status(201).json({
      message: 'Donation recorded successfully, donor profile and bank inventory updated',
      donation
    });
  } catch (error) {
    next(error);
  }
};

const getMyHistory = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(200).json({ history: [] });
    }

    const history = await Donation.find({ donorId: donor._id })
      .populate('bloodBankId', 'name address city')
      .sort({ donationDate: -1 });

    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
};

const getBankDonations = async (req, res, next) => {
  try {
    const { bankId } = req.params;
    
    // Verify auth admin
    const bank = await BloodBank.findById(bankId);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    if (req.user._id.toString() !== bank.adminUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const donations = await Donation.find({ bloodBankId: bankId })
      .populate('donorId', 'name bloodGroup phone email')
      .sort({ donationDate: -1 });

    res.status(200).json({ donations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getMyHistory,
  getBankDonations
};
