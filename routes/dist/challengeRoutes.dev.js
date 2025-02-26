"use strict";

var express = require('express');

var authController = require('../controllers/authController');

var router = express.Router(); // Protect all routes after this middleware

router.use(authController.protect); // Placeholder route until challenge controller is implemented

router.route('/').get(function (req, res) {
  res.status(200).json({
    status: 'success',
    message: 'Challenge routes are under development'
  });
});
module.exports = router;