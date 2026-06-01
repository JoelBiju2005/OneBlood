const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const totalBanks = await BloodBank.countDocuments({ isActive: true });
    const totalRequests = await BloodRequest.countDocuments();
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });

    res.status(200).json({
      summary: {
        totalUsers,
        totalDonors,
        totalBanks,
        totalRequests,
        fulfilledRequests,
        livesSaved: fulfilledRequests * 3, // Each unit saves approx 3 lives
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBankAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bank = await BloodBank.findById(id);

    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    // Mock/aggregate data for charts
    // 1. Monthly Donation Trends (Line chart)
    const monthlyTrends = [
      { name: 'Jan', donations: 12 },
      { name: 'Feb', donations: 19 },
      { name: 'Mar', donations: 15 },
      { name: 'Apr', donations: 24 },
      { name: 'May', donations: 30 },
      { name: 'Jun', donations: 28 },
    ];

    // 2. Blood group distribution (Donut chart)
    const inventory = bank.inventory || {};
    const bloodGroupDistribution = [
      { name: 'A+', value: (inventory.wholeBlood?.Apos || 0) + (inventory.packedRBC?.Apos || 0) },
      { name: 'A-', value: (inventory.wholeBlood?.Aneg || 0) + (inventory.packedRBC?.Aneg || 0) },
      { name: 'B+', value: (inventory.wholeBlood?.Bpos || 0) + (inventory.packedRBC?.Bpos || 0) },
      { name: 'B-', value: (inventory.wholeBlood?.Bneg || 0) + (inventory.packedRBC?.Bneg || 0) },
      { name: 'AB+', value: (inventory.wholeBlood?.ABpos || 0) + (inventory.packedRBC?.ABpos || 0) },
      { name: 'AB-', value: (inventory.wholeBlood?.ABneg || 0) + (inventory.packedRBC?.ABneg || 0) },
      { name: 'O+', value: (inventory.wholeBlood?.Opos || 0) + (inventory.packedRBC?.Opos || 0) },
      { name: 'O-', value: (inventory.wholeBlood?.Oneg || 0) + (inventory.packedRBC?.Oneg || 0) },
    ];

    // 3. Component-wise availability (Bar chart)
    const getComponentSum = (comp) => {
      const g = inventory[comp] || {};
      return Object.values(g).reduce((sum, val) => sum + val, 0);
    };

    const componentAvailability = [
      { name: 'Whole Blood', units: getComponentSum('wholeBlood') },
      { name: 'Packed RBC', units: getComponentSum('packedRBC') },
      { name: 'Plasma', units: getComponentSum('freshFrozenPlasma') },
      { name: 'Platelets', units: getComponentSum('platelets') },
      { name: 'Cryoprecipitate', units: getComponentSum('cryoprecipitate') },
      { name: 'Single Donor Plt', units: getComponentSum('singleDonorPlatelets') },
    ];

    // 4. Requests Fulfilled vs Pending (Area chart)
    const requestStats = [
      { name: 'Week 1', pending: 8, fulfilled: 4 },
      { name: 'Week 2', pending: 12, fulfilled: 9 },
      { name: 'Week 3', pending: 5, fulfilled: 7 },
      { name: 'Week 4', pending: 15, fulfilled: 11 },
    ];

    res.status(200).json({
      monthlyTrends,
      bloodGroupDistribution,
      componentAvailability,
      requestStats,
    });
  } catch (error) {
    next(error);
  }
};

const getPublicStats = async (req, res, next) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const totalBanks = await BloodBank.countDocuments({ isActive: true });
    const requestsFulfilled = await BloodRequest.countDocuments({ status: 'fulfilled' });
    const livesHelped = requestsFulfilled * 3;

    const existingStats = {
      totalDonors: totalDonors,
      totalBanks: totalBanks,
      requestsFulfilled: requestsFulfilled,
      livesHelped: livesHelped
    };

    const [totalDonationsCount, totalTransfusionsCount, livesSavedCount, citiesReachedCount] = await Promise.all([
      Donation.countDocuments({}),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      Donation.countDocuments({}).then(n => n * 3),
      Donor.distinct('city').then(arr => arr.length),
    ]);

    const hofDonations = totalDonationsCount;
    const hofTransfusions = totalTransfusionsCount;
    const hofLivesSaved = hofDonations * 3;
    const hofCities = citiesReachedCount || 0;

    res.status(200).json({
      ...existingStats,
      hallOfFame: {
        totalDonations: hofDonations,
        totalTransfusions: hofTransfusions,
        livesSaved: hofLivesSaved,
        citiesReached: hofCities,
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformAnalytics,
  getBankAnalytics,
  getPublicStats
};
