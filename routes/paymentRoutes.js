const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Payment initialization routes
router.post('/paystack/initialize', paymentController.initializePaystackPayment);
router.post('/flutterwave/initialize', paymentController.initializeFlutterwavePayment);

// Payment verification routes
router.get('/paystack/verify/:reference', paymentController.verifyPaystackPayment);

// Webhooks (these should be public and not protected)
router.post(
  '/webhook/paystack',
  express.raw({ type: 'application/json' }),
  paymentController.paystackWebhook
);

router.post(
  '/webhook/flutterwave',
  paymentController.flutterwaveWebhook
);

module.exports = router;