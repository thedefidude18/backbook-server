const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');
const upload = require('../utils/multer');

router.use(authController.protect); // Protect all routes after this middleware

router.post('/',
  upload.single('bannerImage'), // Handle file upload
  eventController.createEvent
);

// Other event routes...

module.exports = router;