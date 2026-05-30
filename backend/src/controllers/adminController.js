const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Message = require('../models/Message');

// GET /api/admin/users — Paginated, filterable user list
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { onebloodId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/donors — All donor profiles with user data
const getDonors = async (req, res, next) => {
  try {
    const donors = await Donor.find()
      .populate('userId', 'name email phone onebloodId role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ donors, total: donors.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/banks — All blood bank profiles
const getBanks = async (req, res, next) => {
  try {
    const banks = await BloodBank.find()
      .populate('adminUserId', 'name email phone onebloodId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ banks, total: banks.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/requests — All blood requests
const getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const requests = await BloodRequest.find(filter)
      .populate('requesterId', 'name email phone onebloodId')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/messages — Recent chat messages
const getMessages = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const messages = await Message.find()
      .populate('senderId', 'name email onebloodId')
      .populate('receiverId', 'name email onebloodId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ messages, total: messages.length });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats — Aggregated platform statistics
const getStats = async (req, res, next) => {
  try {
    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Requests by status
    const requestsByStatus = await BloodRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Donors by city
    const donorsByCity = await Donor.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Blood group distribution
    const bloodGroupDist = await Donor.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalDonors = await Donor.countDocuments();
    const totalBanks = await BloodBank.countDocuments();
    const totalRequests = await BloodRequest.countDocuments();
    const totalMessages = await Message.countDocuments();

    res.status(200).json({
      totals: { totalUsers, totalDonors, totalBanks, totalRequests, totalMessages },
      usersByRole,
      requestsByStatus,
      donorsByCity,
      bloodGroupDist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getDonors,
  getBanks,
  getRequests,
  getMessages,
  getStats,
};
