const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/fcm',
  authController.protect,
  userController.updateFCMToken
);

module.exports = router;
