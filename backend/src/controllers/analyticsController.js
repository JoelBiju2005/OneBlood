const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const DonationMatch = require('../models/DonationMatch');
    const Hospital = require('../models/Hospital');

    const totalUsers = await User.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const totalBanks = await BloodBank.countDocuments({ isActive: true });
    const totalHospitals = await Hospital.countDocuments();
    const totalRequests = await BloodRequest.countDocuments();

    // Match counts
    const totalMatches = await DonationMatch.countDocuments();
    const completedMatches = await DonationMatch.countDocuments({ status: 'completed' });
    const cancelledMatches = await DonationMatch.countDocuments({ status: 'cancelled' });
    const activeMatches = await DonationMatch.countDocuments({ status: 'in_progress' });

    // Most active donors
    const activeDonorsAgg = await DonationMatch.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$donorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const activeDonors = await Promise.all(activeDonorsAgg.map(async (item) => {
      const u = await User.findById(item._id).select('name email onebloodId');
      return { user: u, count: item.count };
    }));

    // Most active hospitals
    const activeHospAgg = await DonationMatch.aggregate([
      { $match: { status: 'completed', destinationType: 'Hospital' } },
      { $group: { _id: '$hospitalId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const activeHospitals = await Promise.all(activeHospAgg.map(async (item) => {
      const h = await Hospital.findById(item._id);
      return { hospitalName: h ? h.hospitalName : 'Unknown Hospital', count: item.count };
    }));

    // Most active blood banks
    const activeBankAgg = await DonationMatch.aggregate([
      { $match: { status: 'completed', destinationType: 'BloodBank' } },
      { $group: { _id: '$bloodBankId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const activeBloodBanks = await Promise.all(activeBankAgg.map(async (item) => {
      const b = await BloodBank.findById(item._id);
      return { bankName: b ? b.name : 'Unknown Blood Bank', count: item.count };
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const reqCount = await BloodRequest.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const matchCount = await DonationMatch.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth }, status: 'completed' });

      monthlyTrends.push({ name: mName, requests: reqCount, donations: matchCount });
    }

    res.status(200).json({
      summary: {
        totalUsers,
        totalDonors,
        totalBanks,
        totalHospitals,
        totalRequests,
        totalMatches,
        completedMatches,
        cancelledMatches,
        activeMatches,
        livesSaved: completedMatches * 3,
      },
      activeDonors,
      activeHospitals,
      activeBloodBanks,
      monthlyTrends
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
