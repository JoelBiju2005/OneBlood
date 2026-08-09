const mongoose = require('mongoose');

const financialDonationSchema = new mongoose.Schema({
  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpaySignature: { type: String },
  donorName:         { type: String, required: true },
  donorEmail:        { type: String, required: true },
  donorPhone:        { type: String },
  amountInPaise:     { type: Number, required: true },   // Razorpay works in paise
  amountInRupees:    { type: Number, required: true },   // for display
  currency:          { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  message:           { type: String, maxlength: 300 },   // optional note from donor
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null if guest
  receiptId:         { type: String, unique: true },     // OBD-XXXXXXXX format
}, { timestamps: true });

module.exports = mongoose.model('FinancialDonation', financialDonationSchema);
