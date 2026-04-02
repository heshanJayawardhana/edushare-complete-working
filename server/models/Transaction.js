const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Denormalized fields for easy listing/searching
    date: { type: String, required: true },
    resourceName: { type: String, required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },

    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    paymentMethod: { type: String, enum: ['card', 'paypal'], required: false },
    cardLast4: { type: String, required: false },
    expiryMonth: { type: Number, required: false },
    expiryYear: { type: Number, required: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

