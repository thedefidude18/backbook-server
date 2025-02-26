const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Placeholder route until challenge controller is implemented
router.route('/')
  .get((req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Challenge routes are under development'
    });
  });

module.exports = router;
