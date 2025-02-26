const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authController = require('../controllers/authController');

// Protect all wallet routes
router.use(authController.protect);

// Wallet routes
router.get('/balance', walletController.getWalletBalance);
router.post('/deposit/initiate', walletController.initiateDeposit);
router.get('/transactions', walletController.getTransactions);
router.post('/withdraw', walletController.withdrawFunds);

// Webhook for payment verification (this route should be public)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  walletController.handleWebhook
);

module.exports = router;