const Razorpay = require('razorpay');
const crypto = require('crypto');
const FinancialDonation = require('../models/FinancialDonation');
const { sendFinancialDonationThankYouEmail } = require('../services/emailService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate unique receipt ID: OBD-XXXXXXXX
const generateReceiptId = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id, exists;
  let attempts = 0;
  do {
    if (attempts++ > 10) throw new Error('Receipt ID generation failed');
    const suffix = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    id = `OBD-${suffix}`;
    exists = await FinancialDonation.findOne({ receiptId: id }).lean();
  } while (exists);
  return id;
};

// POST /api/financial-donations/create-order
const createOrder = async (req, res, next) => {
  try {
    const { amount, donorName, donorEmail, donorPhone, message } = req.body;

    // Amount validation — min ₹10, max ₹1,00,000
    const amountInRupees = parseInt(amount, 10);
    if (!amountInRupees || amountInRupees < 10 || amountInRupees > 100000) {
      return res.status(400).json({ success: false, message: 'Donation amount must be between ₹10 and ₹1,00,000.' });
    }

    const receiptId = await generateReceiptId();
    const amountInPaise = amountInRupees * 100;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  receiptId,
      notes: {
        donorName,
        donorEmail,
        platform: 'OneBlood'
      }
    });

    // Save to DB with status 'created'
    await FinancialDonation.create({
      razorpayOrderId: order.id,
      donorName:       donorName.trim(),
      donorEmail:      donorEmail.toLowerCase().trim(),
      donorPhone:      donorPhone || '',
      amountInPaise,
      amountInRupees,
      message:         message || '',
      userId:          req.user ? req.user._id : null,
      receiptId,
      status:          'created'
    });

    return res.json({
      success: true,
      orderId:       order.id,
      amount:        amountInPaise,
      currency:      'INR',
      receiptId,
      keyId:         process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/financial-donations/verify-payment
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature — this is the critical security check
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Mark as failed in DB
      await FinancialDonation.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ success: false, message: 'Payment verification failed. If money was deducted, it will be refunded within 5-7 business days.' });
    }

    // Signature valid — update DB record
    const donation = await FinancialDonation.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid'
      },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    // Send thank you email — non-blocking
    sendFinancialDonationThankYouEmail({
      name:          donation.donorName,
      email:         donation.donorEmail,
      amountInRupees: donation.amountInRupees,
      receiptId:     donation.receiptId,
      paymentId:     razorpay_payment_id,
    }).catch(err => console.error('[Email] Financial donation thank you failed:', err));

    return res.json({
      success:    true,
      receiptId:  donation.receiptId,
      paymentId:  razorpay_payment_id,
      amount:     donation.amountInRupees,
      donorName:  donation.donorName,
      donorEmail: donation.donorEmail,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/financial-donations/stats (public — total raised, donor count)
const getPublicStats = async (req, res, next) => {
  try {
    const result = await FinancialDonation.aggregate([
      { $match: { status: 'paid' } },
      { $group: {
        _id: null,
        totalRaised: { $sum: '$amountInRupees' },
        totalDonors: { $sum: 1 }
      }}
    ]);
    const stats = result[0] || { totalRaised: 0, totalDonors: 0 };
    return res.json({ success: true, totalRaised: stats.totalRaised, totalDonors: stats.totalDonors });
  } catch (err) {
    next(err);
  }
};

// GET /api/financial-donations/admin/all (admin only)
const adminGetAllDonations = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const [donations, total] = await Promise.all([
      FinancialDonation.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FinancialDonation.countDocuments()
    ]);

    // Calculate overall stats for the dashboard info summary
    const overallStats = await FinancialDonation.aggregate([
      { $match: { status: 'paid' } },
      { $group: {
        _id: null,
        totalRaised: { $sum: '$amountInRupees' },
        totalDonors: { $sum: 1 }
      }}
    ]);
    const stats = overallStats[0] || { totalRaised: 0, totalDonors: 0 };

    // Calculate this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const thisMonthStats = await FinancialDonation.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: {
        _id: null,
        raised: { $sum: '$amountInRupees' }
      }}
    ]);
    const monthlyRaised = thisMonthStats[0] ? thisMonthStats[0].raised : 0;

    res.json({
      success: true,
      donations,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: {
        totalRaised: stats.totalRaised,
        totalDonors: stats.totalDonors,
        monthlyRaised
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/financial-donations/admin/export (admin only)
const adminExportDonationsCSV = async (req, res, next) => {
  try {
    const donations = await FinancialDonation.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .lean();

    let csvContent = 'Receipt ID,Donor Name,Email,Phone,Amount (INR),Date,Message\n';
    for (const d of donations) {
      const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '';
      const name = (d.donorName || '').replace(/"/g, '""');
      const email = (d.donorEmail || '').replace(/"/g, '""');
      const phone = (d.donorPhone || '').replace(/"/g, '""');
      const amount = d.amountInRupees || 0;
      const receiptId = d.receiptId || '';
      const msg = (d.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      csvContent += `"${receiptId}","${name}","${email}","${phone}",${amount},"${dateStr}","${msg}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_donations.csv');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPublicStats,
  adminGetAllDonations,
  adminExportDonationsCSV
};
