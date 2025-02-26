const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Paystack
exports.initializePaystackPayment = catchAsync(async (req, res, next) => {
  const { amount, email } = req.body;
  
  if (!amount || amount < 100) {
    return next(new AppError('Amount must be at least 100', 400));
  }
  
  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user.id,
    amount,
    type: 'deposit',
    status: 'pending',
    payment_method: 'paystack'
  });
  
  // Initialize payment with Paystack
  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: email || req.user.email,
      amount: amount * 100, // Paystack expects amount in kobo
      reference: transaction._id.toString(),
      callback_url: `${process.env.FRONTEND_URL}/wallet/verify`
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: transaction._id,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference
    }
  });
});

// Initialize Flutterwave
exports.initializeFlutterwavePayment = catchAsync(async (req, res, next) => {
  const { amount, email } = req.body;
  
  if (!amount || amount < 100) {
    return next(new AppError('Amount must be at least 100', 400));
  }
  
  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user.id,
    amount,
    type: 'deposit',
    status: 'pending',
    payment_method: 'flutterwave'
  });
  
  // Generate a unique transaction reference
  const txRef = `FB-${Date.now()}-${transaction._id}`;
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: transaction._id,
      tx_ref: txRef,
      amount,
      public_key: process.env.FLUTTERWAVE_PUBLIC_KEY,
      customer: {
        email: email || req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`
      }
    }
  });
});

// Verify Paystack Payment
exports.verifyPaystackPayment = catchAsync(async (req, res, next) => {
  const { reference } = req.params;
  
  // Verify payment with Paystack
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    }
  );
  
  if (response.data.data.status !== 'success') {
    return next(new AppError('Payment verification failed', 400));
  }
  
  // Update transaction status
  const transaction = await Transaction.findById(reference);
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }
  
  transaction.status = 'completed';
  transaction.payment_details = response.data.data;
  await transaction.save();
  
  // Update user wallet balance
  const user = await User.findById(req.user.id);
  user.wallet.balance += transaction.amount;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

// Webhook for Paystack
exports.paystackWebhook = catchAsync(async (req, res, next) => {
  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (hash !== req.headers['x-paystack-signature']) {
    return next(new AppError('Invalid signature', 400));
  }
  
  const event = req.body;
  
  // Handle successful charge
  if (event.event === 'charge.success') {
    const transaction = await Transaction.findById(event.data.reference);
    if (!transaction) return res.status(200).send('OK');
    
    if (transaction.status === 'completed') return res.status(200).send('OK');
    
    transaction.status = 'completed';
    transaction.payment_details = event.data;
    await transaction.save();
    
    // Update user wallet balance
    const user = await User.findById(transaction.user);
    user.wallet.balance += transaction.amount;
    await user.save({ validateBeforeSave: false });
  }
  
  res.status(200).send('OK');
});

// Webhook for Flutterwave
exports.flutterwaveWebhook = catchAsync(async (req, res, next) => {
  // Verify webhook signature
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  
  if (!signature || signature !== secretHash) {
    return next(new AppError('Invalid signature', 400));
  }
  
  const event = req.body;
  
  if (event.status === 'successful') {
    // Extract transaction ID from tx_ref (FB-timestamp-transactionId)
    const txRef = event.data.tx_ref;
    const transactionId = txRef.split('-')[2];
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(200).send('OK');
    
    if (transaction.status === 'completed') return res.status(200).send('OK');
    
    transaction.status = 'completed';
    transaction.payment_details = event.data;
    await transaction.save();
    
    // Update user wallet balance
    const user = await User.findById(transaction.user);
    user.wallet.balance += transaction.amount;
    await user.save({ validateBeforeSave: false });
  }
  
  res.status(200).send('OK');
});