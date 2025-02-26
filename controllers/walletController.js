const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const axios = require('axios');

// Get wallet balance
exports.getWalletBalance = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('wallet');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      balance: user.wallet ? user.wallet.balance : 0,
      currency: 'NGN'
    }
  });
});

// Initiate deposit
exports.initiateDeposit = catchAsync(async (req, res, next) => {
  const { amount, payment_method, email, name } = req.body;

  if (!amount || amount < 100) {
    return next(new AppError('Minimum deposit amount is ₦100', 400));
  }

  // Create a transaction record
  const transaction = await Transaction.create({
    user: req.user.id,
    amount,
    type: 'deposit',
    status: 'pending',
    payment_method
  });

  // For demo purposes, we'll just return a success response
  // In a real app, you would integrate with Paystack or another payment provider
  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: transaction._id,
      amount,
      authorization_url: `https://checkout.paystack.com/demo-payment?tx_ref=${transaction._id}&amount=${amount * 100}`,
      reference: transaction._id
    }
  });
});

// Get user transactions
exports.getTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: {
      transactions
    }
  });
});

// Withdraw funds
exports.withdrawFunds = catchAsync(async (req, res, next) => {
  const { amount, bank_code, account_number, account_name } = req.body;

  if (!amount || amount < 500) {
    return next(new AppError('Minimum withdrawal amount is ₦500', 400));
  }

  const user = await User.findById(req.user.id);

  if (!user.wallet || user.wallet.balance < amount) {
    return next(new AppError('Insufficient funds', 400));
  }

  // Create a transaction record
  const transaction = await Transaction.create({
    user: req.user.id,
    amount,
    type: 'withdrawal',
    status: 'pending',
    payment_method: 'bank_transfer',
    metadata: {
      bank_code,
      account_number,
      account_name
    }
  });

  // Update user wallet balance
  user.wallet.balance -= amount;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: transaction._id,
      amount,
      status: 'pending'
    }
  });
});

// Handle payment webhook
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const payload = req.body;
  
  // Verify webhook signature (in a real app)
  // const signature = req.headers['x-paystack-signature'];
  
  // Process the webhook payload
  if (payload.event === 'charge.success') {
    const transactionId = payload.data.reference;
    
    // Find and update the transaction
    const transaction = await Transaction.findById(transactionId);
    
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'completed';
      await transaction.save();
      
      // Update user wallet balance
      const user = await User.findById(transaction.user);
      
      if (!user.wallet) {
        user.wallet = { balance: 0 };
      }
      
      user.wallet.balance += transaction.amount;
      await user.save({ validateBeforeSave: false });
    }
  }
  
  // Always return a 200 response to acknowledge receipt
  res.status(200).json({ received: true });
});