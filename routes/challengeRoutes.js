const express = require('express');
const authController = require('../controllers/authController');
const challengeController = require('../controllers/challengeController');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/challenges');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
  })
});

// Protect all routes
router.use(authController.protect);

// Challenge routes
router.post('/', upload.single('photo'), challengeController.createChallenge);
router.post('/respond', challengeController.respondToChallenge);
router.patch('/:challengeId/complete', challengeController.completeChallenge);
router.get('/', challengeController.getUserChallenges);

module.exports = router;