const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user']
    },
    amount: {
      type: Number,
      required: [true, 'Transaction must have an amount']
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'refund'],
      required: [true, 'Transaction must have a type']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    payment_method: {
      type: String,
      enum: ['paystack', 'flutterwave', 'bank_transfer', 'wallet'],
      required: [true, 'Transaction must have a payment method']
    },
    reference: {
      type: String,
      unique: true,
      sparse: true
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate a reference before saving
transactionSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `TX-${this._id}`;
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;