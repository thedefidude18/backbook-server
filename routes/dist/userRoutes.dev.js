"use strict";

var express = require('express');

var router = express.Router();

var authController = require('../controllers/authController');

var userController = require('../controllers/userController');

var upload = require('../utils/multer'); // Authentication routes


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); // Protected routes

router.use(authController.protect); // User profile routes

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.patch('/updateMyPassword', authController.updatePassword); // Admin routes

router.use(authController.restrictTo('admin'));
router.route('/').get(userController.getAllUsers).post(userController.createUser);
router.route('/:id').get(userController.getUser).patch(userController.updateUser)["delete"](userController.deleteUser);
module.exports = router;