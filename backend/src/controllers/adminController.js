const User = require('../models/User');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Message = require('../models/Message');
const Hospital = require('../models/Hospital');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const SystemSettings = require('../models/SystemSettings');
const DonationMatch = require('../models/DonationMatch');
const bcrypt = require('bcryptjs');

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

let cachedStats = null;
let lastStatsFetch = 0;
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/admin/stats — Aggregated platform statistics (In-memory aggregate with cache)
const getStats = async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedStats && (now - lastStatsFetch < STATS_CACHE_DURATION)) {
      return res.status(200).json(cachedStats);
    }

    const users = await User.find() || [];
    const donors = await Donor.find() || [];
    const requests = await BloodRequest.find() || [];
    const banks = await BloodBank.find() || [];
    const messages = await Message.find() || [];

    // Group users by role in memory
    const roleCounts = {};
    users.forEach(u => {
      if (u && u.role) {
        roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
      }
    });
    const usersByRole = Object.keys(roleCounts).map(role => ({ _id: role, count: roleCounts[role] }));

    // Group requests by status in memory
    const statusCounts = {};
    requests.forEach(r => {
      if (r && r.status) {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    });
    const requestsByStatus = Object.keys(statusCounts).map(status => ({ _id: status, count: statusCounts[status] }));

    // Group donors by city in memory
    const cityCounts = {};
    donors.forEach(d => {
      if (d && d.city) {
        cityCounts[d.city] = (cityCounts[d.city] || 0) + 1;
      }
    });
    const donorsByCity = Object.keys(cityCounts)
      .map(city => ({ _id: city, count: cityCounts[city] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group donors by blood group in memory
    const groupCounts = {};
    donors.forEach(d => {
      if (d && d.bloodGroup) {
        groupCounts[d.bloodGroup] = (groupCounts[d.bloodGroup] || 0) + 1;
      }
    });
    const bloodGroupDist = Object.keys(groupCounts)
      .map(bg => ({ _id: bg, count: groupCounts[bg] }))
      .sort((a, b) => b.count - a.count);

    cachedStats = {
      totals: {
        totalUsers: users.length,
        totalDonors: donors.length,
        totalBanks: banks.length,
        totalRequests: requests.length,
        totalMessages: messages.length
      },
      usersByRole,
      requestsByStatus,
      donorsByCity,
      bloodGroupDist,
    };
    lastStatsFetch = now;

    res.status(200).json(cachedStats);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:id — Edit a user profile
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, city, isVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (city) user.city = city;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id — Delete a user and their sub-profiles
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated donor profile
    await Donor.findOneAndDelete({ userId: id });

    // Delete associated blood bank profile
    await BloodBank.findOneAndDelete({ adminUserId: id });

    // Delete the user itself
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'User and all associated profiles deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/donors/:id — Delete only a donor profile
const deleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Update user flag
    await User.findByIdAndUpdate(donor.userId, { donorProfileComplete: false, role: 'patient' });

    // Delete the donor profile
    await Donor.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Donor profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/banks/:id — Delete only a blood bank profile
const deleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    const bank = await BloodBank.findById(id);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank profile not found' });
    }

    // Update user flag
    await User.findByIdAndUpdate(bank.adminUserId, { bankProfileComplete: false, role: 'patient' });

    // Delete the bank profile
    await BloodBank.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Blood bank profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/requests/:id — Delete a blood request
const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await BloodRequest.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Emergency request deleted successfully' });
  } catch (error) {
    next(error);
  }
};


const getHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find()
      .populate('userId', 'name email phone onebloodId role createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    next(error);
  }
};

const approveHospital = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved / rejected

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const hospital = await Hospital.findById(id).populate('userId');
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verificationStatus = status;
    await hospital.save();

    if (hospital.userId) {
      hospital.userId.isVerified = (status === 'approved');
      await hospital.userId.save();
    }

    res.status(200).json({ success: true, message: `Hospital verification status updated to ${status}`, hospital });
  } catch (error) {
    next(error);
  }
};

const approveBloodBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved / rejected

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const bank = await BloodBank.findById(id).populate('adminUserId');
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    bank.verificationStatus = status;
    bank.isVerified = (status === 'approved');
    await bank.save();

    if (bank.adminUserId) {
      bank.adminUserId.isVerified = (status === 'approved');
      await bank.adminUserId.save();
    }

    res.status(200).json({ success: true, message: `Blood Bank verification status updated to ${status}`, bank });
  } catch (error) {
    next(error);
  }
};

const getEmailTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ templateName: 1 });
    res.status(200).json({ success: true, count: templates.length, templates });
  } catch (error) {
    next(error);
  }
};

const updateEmailTemplate = async (req, res, next) => {
  try {
    const { templateName, subject, html, variables, active } = req.body;
    let template = await EmailTemplate.findOne({ templateName });
    if (!template) {
      template = new EmailTemplate({ templateName, subject, html, variables, active });
    } else {
      if (subject) template.subject = subject;
      if (html) template.html = html;
      if (variables) template.variables = variables;
      if (active !== undefined) template.active = active;
    }
    await template.save();
    res.status(200).json({ success: true, message: 'Email template saved successfully', template });
  } catch (error) {
    next(error);
  }
};

const getEmailLogs = async (req, res, next) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { emailProvider, fromEmail, escalationEnabled, donorMinAge, donorMaxAge, donorMinWeight, donationGapDays } = req.body;
    const settings = await SystemSettings.findOne();
    if (!settings) {
      await SystemSettings.create(req.body);
    } else {
      if (emailProvider) settings.emailProvider = emailProvider;
      if (fromEmail) settings.fromEmail = fromEmail;
      if (escalationEnabled !== undefined) settings.escalationEnabled = escalationEnabled;
      if (donorMinAge !== undefined) settings.donorMinAge = donorMinAge;
      if (donorMaxAge !== undefined) settings.donorMaxAge = donorMaxAge;
      if (donorMinWeight !== undefined) settings.donorMinWeight = donorMinWeight;
      if (donationGapDays !== undefined) settings.donationGapDays = donationGapDays;
      await settings.save();
    }
    const updated = await SystemSettings.findOne();
    res.status(200).json({ success: true, settings: updated });
  } catch (error) {
    next(error);
  }
};

const seedHubballiData = async (req, res, next) => {
  try {
    // 1. KIMS Hospital
    let kimsUser = await User.findOne({ email: 'kims@hubli.in' });
    if (!kimsUser) {
      const passwordHash = await bcrypt.hash('OneBloodHospital2026!', 10);
      kimsUser = await User.create({
        onebloodId: 'OB-KIMS1',
        name: 'KIMS Hospital Hubli',
        email: 'kims@hubli.in',
        phone: '+918362485111',
        passwordHash,
        role: 'hospital',
        city: 'Hubballi',
        hospitalProfileComplete: true
      });
      await Hospital.create({
        userId: kimsUser._id,
        hospitalName: 'KIMS Hospital Hubli',
        registrationNumber: 'HOSP-KA-836-001',
        hospitalType: 'Government',
        address: 'Vidyanagar, Hubballi',
        city: 'Hubballi',
        state: 'Karnataka',
        pincode: '580021',
        emergencyContact: '+918362485111',
        website: 'http://kimshubli.org',
        authorizedPersonName: 'Dr. S. F. Kammar',
        designation: 'Medical Superintendent',
        verificationStatus: 'approved',
        location: {
          type: 'Point',
          coordinates: [75.1228, 15.3716]
        }
      });
    }

    // 2. SDM Hospital
    let sdmUser = await User.findOne({ email: 'sdm@dharwad.in' });
    if (!sdmUser) {
      const passwordHash = await bcrypt.hash('OneBloodHospital2026!', 10);
      sdmUser = await User.create({
        onebloodId: 'OB-SDMHS1',
        name: 'SDM Medical Hospital Dharwad',
        email: 'sdm@dharwad.in',
        phone: '+918362477777',
        passwordHash,
        role: 'hospital',
        city: 'Dharwad',
        hospitalProfileComplete: true
      });
      await Hospital.create({
        userId: sdmUser._id,
        hospitalName: 'SDM Hospital Dharwad',
        registrationNumber: 'HOSP-KA-836-002',
        hospitalType: 'Private',
        address: 'Sattur, Dharwad',
        city: 'Dharwad',
        state: 'Karnataka',
        pincode: '580009',
        emergencyContact: '+918362477777',
        website: 'http://sdmmedical.org',
        authorizedPersonName: 'Dr. Niranjan Kumar',
        designation: 'Medical Director',
        verificationStatus: 'approved',
        location: {
          type: 'Point',
          coordinates: [75.0768, 15.4312]
        }
      });
    }

    // 3. Rashtrotthana Blood Bank
    let bbUser = await User.findOne({ email: 'rashtrotthana@hubli.in' });
    if (!bbUser) {
      const passwordHash = await bcrypt.hash('OneBloodBank2026!', 10);
      bbUser = await User.create({
        onebloodId: 'OB-RBBH1',
        name: 'Rashtrotthana Blood Bank',
        email: 'rashtrotthana@hubli.in',
        phone: '+918362356611',
        passwordHash,
        role: 'blood_bank',
        city: 'Hubballi',
        bankProfileComplete: true
      });
      await BloodBank.create({
        adminUserId: bbUser._id,
        name: 'Rashtrotthana Blood Bank Hubli',
        registrationNumber: 'BB-KA-836-001',
        address: 'Keshwapur, Hubballi',
        city: 'Hubballi',
        phone: '+918362356611',
        email: 'rashtrotthana@hubli.in',
        isVerified: true,
        verificationStatus: 'approved',
        location: {
          type: 'Point',
          coordinates: [75.1472, 15.3678]
        },
        inventory: [
          { bloodGroup: 'A+', units: 25, componentType: 'Whole Blood' },
          { bloodGroup: 'B+', units: 40, componentType: 'Whole Blood' },
          { bloodGroup: 'O+', units: 30, componentType: 'Whole Blood' },
          { bloodGroup: 'AB+', units: 15, componentType: 'Whole Blood' },
          { bloodGroup: 'O-', units: 5, componentType: 'RBC' }
        ]
      });
    }

    res.status(200).json({ success: true, message: 'Hubballi-Dharwad test hospitals and blood banks seeded successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getDonors,
  getBanks,
  getRequests,
  getMessages,
  getStats,
  updateUser,
  deleteUser,
  deleteDonor,
  deleteBank,
  deleteRequest,
  getHospitals,
  approveHospital,
  approveBloodBank,
  getEmailTemplates,
  updateEmailTemplate,
  getEmailLogs,
  getSettings,
  updateSettings,
  seedHubballiData
};
