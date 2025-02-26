const express = require('express');
const eventController = require('../controllers/eventController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.route('/')
  .get(eventController.getAllEvents)
  .post(eventController.createEvent);

router.route('/:id')
  .get(eventController.getEvent)
  .patch(eventController.updateEvent)
  .delete(eventController.deleteEvent);

router.route('/:id/attend')
  .post(eventController.attendEvent);

router.route('/:id/unattend')
  .post(eventController.unattendEvent);

module.exports = router;