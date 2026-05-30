const BloodBank = require('../models/BloodBank');
const User = require('../models/User');
const socketService = require('../services/socketService');

// Map blood group strings like A+ or O- to DB schema keys like Apos or Oneg
const mapBloodGroupToKey = (bg) => {
  if (!bg) return null;
  return bg.trim().toUpperCase().replace('+', 'pos').replace('-', 'neg');
};

// Map component keys
const mapComponentToKey = (comp) => {
  if (!comp) return 'wholeBlood';
  const mapper = {
    'whole_blood': 'wholeBlood',
    'prbc': 'packedRBC',
    'plasma': 'freshFrozenPlasma',
    'platelets': 'platelets',
    'cryoprecipitate': 'cryoprecipitate',
    'sdp': 'singleDonorPlatelets'
  };
  return mapper[comp.toLowerCase()] || comp;
};

const registerBank = async (req, res, next) => {
  try {
    const {
      name,
      registrationNumber,
      licenseNumber,
      phone,
      alternatePhone,
      email,
      website,
      address,
      city,
      district,
      state,
      pincode,
      lat,
      lng,
      facilities,
      operatingHours,
      acceptsWalkIn,
      acceptsOnlineRequest,
      emergencyContact,
    } = req.body;

    const adminUserId = req.user._id;

    // Check if user already manages a bank
    let bank = await BloodBank.findOne({ adminUserId });

    const bankData = {
      adminUserId,
      name,
      registrationNumber,
      licenseNumber,
      phone,
      alternatePhone: alternatePhone || '',
      email,
      website: website || '',
      address,
      city,
      district,
      state,
      pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // [longitude, latitude]
      },
      facilities: facilities ? (Array.isArray(facilities) ? facilities : [facilities]) : [],
      operatingHours: operatingHours || { is24x7: true },
      acceptsWalkIn: acceptsWalkIn !== false,
      acceptsOnlineRequest: acceptsOnlineRequest !== false,
      emergencyContact: emergencyContact || phone,
      isVerified: true, // Default true in dev seeding/mocking
      isActive: true,
      inventory: {
        wholeBlood:       { Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 },
        packedRBC:        { Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 },
        freshFrozenPlasma:{ Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 },
        platelets:        { Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 },
        cryoprecipitate:  { Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 },
        singleDonorPlatelets: { Apos: 10, Aneg: 2, Bpos: 10, Bneg: 2, ABpos: 5, ABneg: 1, Opos: 10, Oneg: 2 }
      }
    };

    if (bank) {
      bank = await BloodBank.findOneAndUpdate({ adminUserId }, bankData, { new: true });
      await User.findByIdAndUpdate(adminUserId, { role: 'blood_bank', bankProfileComplete: true });
    } else {
      bank = await BloodBank.create(bankData);
      // Promote user role to blood bank and set setup complete
      await User.findByIdAndUpdate(adminUserId, { role: 'blood_bank', bankProfileComplete: true });
    }

    res.status(201).json({
      message: 'Blood bank profile registered successfully',
      bank,
    });
  } catch (error) {
    next(error);
  }
};

const getBanks = async (req, res, next) => {
  try {
    const { bloodGroup, component, lat, lng, radius, minUnits } = req.query;
    const query = { isActive: true };

    if (lat && lng) {
      const rad = parseFloat(radius) || 10;
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

    // Filter by availability of specific component and blood group if provided
    if (bloodGroup && component) {
      const dbBloodKey = mapBloodGroupToKey(bloodGroup);
      const dbComponentKey = mapComponentToKey(component);
      const units = parseInt(minUnits, 10) || 1;
      
      if (dbBloodKey && dbComponentKey) {
        query[`inventory.${dbComponentKey}.${dbBloodKey}`] = { $gte: units };
      }
    }

    const banks = await BloodBank.find(query);

    res.status(200).json({
      count: banks.length,
      banks,
    });
  } catch (error) {
    next(error);
  }
};

const getBankById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bank = await BloodBank.findById(id);

    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    res.status(200).json({ bank });
  } catch (error) {
    next(error);
  }
};

const updateBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    let bank = await BloodBank.findById(id);

    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    if (req.user._id.toString() !== bank.adminUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this blood bank' });
    }

    const updates = req.body;
    if (updates.lat && updates.lng) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(updates.lng), parseFloat(updates.lat)],
      };
    }

    bank = await BloodBank.findByIdAndUpdate(id, updates, { new: true });
    res.status(200).json({ message: 'Blood bank updated successfully', bank });
  } catch (error) {
    next(error);
  }
};

const updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body; // Full inventory object

    const bank = await BloodBank.findById(id);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    if (req.user._id.toString() !== bank.adminUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update fields
    bank.inventory = inventory;
    bank.lastInventoryUpdate = new Date();
    await bank.save();

    // Check for low inventory quantities (< 5 units) to broadcast warnings
    const lowStockAlerts = [];
    const components = ['wholeBlood', 'packedRBC', 'freshFrozenPlasma', 'platelets', 'cryoprecipitate', 'singleDonorPlatelets'];
    const groups = ['Apos', 'Aneg', 'Bpos', 'Bneg', 'ABpos', 'ABneg', 'Opos', 'Oneg'];

    for (const comp of components) {
      for (const gp of groups) {
        const quantity = bank.inventory[comp]?.[gp] || 0;
        if (quantity < 5) {
          lowStockAlerts.push({ component: comp, bloodGroup: gp, qty: quantity });
        }
      }
    }

    // Broadcast low inventory warnings to bank room
    if (lowStockAlerts.length > 0) {
      socketService.broadcastToRoom(`bloodbank:${bank._id}`, 'low_inventory_alert', {
        bankId: bank._id,
        bankName: bank.name,
        alerts: lowStockAlerts,
      });
    }

    // Broadcast system-wide inventory update event so active maps refresh list
    socketService.broadcastToAll('inventory_updated', {
      bankId: bank._id,
      name: bank.name,
      location: bank.location,
      inventory: bank.inventory,
    });

    res.status(200).json({
      message: 'Inventory updated successfully',
      inventory: bank.inventory,
      lowStockCount: lowStockAlerts.length,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyBanks = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const rad = parseFloat(radius) || 10;
    const banks = await BloodBank.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: rad * 1000,
        },
      },
    });

    res.status(200).json({ banks });
  } catch (error) {
    next(error);
  }
};

const getBankProfile = async (req, res, next) => {
  try {
    const bank = await BloodBank.findOne({ adminUserId: req.user._id });
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank profile not found' });
    }
    res.status(200).json({ bank });
  } catch (error) {
    next(error);
  }
};

const updateInventorySelf = async (req, res, next) => {
  try {
    const { inventory } = req.body;
    const bank = await BloodBank.findOne({ adminUserId: req.user._id });
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank profile not found' });
    }
    
    bank.inventory = inventory;
    bank.lastInventoryUpdate = new Date();
    await bank.save();
    
    // Broadcast low inventory warnings to bank room
    const lowStockAlerts = [];
    const components = ['wholeBlood', 'packedRBC', 'freshFrozenPlasma', 'platelets', 'cryoprecipitate', 'singleDonorPlatelets'];
    const groups = ['Apos', 'Aneg', 'Bpos', 'Bneg', 'ABpos', 'ABneg', 'Opos', 'Oneg'];

    for (const comp of components) {
      for (const gp of groups) {
        const quantity = bank.inventory[comp]?.[gp] || 0;
        if (quantity < 5) {
          lowStockAlerts.push({ component: comp, bloodGroup: gp, qty: quantity });
        }
      }
    }

    if (lowStockAlerts.length > 0) {
      socketService.broadcastToRoom(`bloodbank:${bank._id}`, 'low_inventory_alert', {
        bankId: bank._id,
        bankName: bank.name,
        alerts: lowStockAlerts,
      });
    }

    // Broadcast system-wide inventory update event so active maps refresh list
    socketService.broadcastToAll('inventory_updated', {
      bankId: bank._id,
      name: bank.name,
      location: bank.location,
      inventory: bank.inventory,
    });

    res.status(200).json({
      message: 'Inventory updated successfully',
      inventory: bank.inventory,
      lowStockCount: lowStockAlerts.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerBank,
  getBanks,
  getBankById,
  updateBank,
  updateInventory,
  getNearbyBanks,
  getBankProfile,
  updateInventorySelf,
};
