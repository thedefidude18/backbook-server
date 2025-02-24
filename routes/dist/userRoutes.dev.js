"use strict";

var express = require('express');

var authController = require('../controllers/authController');

var userController = require('../controllers/userController');

var router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/fcm', authController.protect, userController.updateFCMToken);
module.exports = router;