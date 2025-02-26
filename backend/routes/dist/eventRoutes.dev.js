"use strict";

var express = require('express');

var router = express.Router();

var eventController = require('../controllers/eventController');

var authController = require('../controllers/authController');

var upload = require('../utils/multer');

router.use(authController.protect); // Protect all routes after this middleware

router.post('/', upload.single('bannerImage'), // Handle file upload
eventController.createEvent); // Other event routes...

module.exports = router;