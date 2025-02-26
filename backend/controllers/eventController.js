fconst Event = require('../models/eventModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createEvent = catchAsync(async (req, res, next) => {
  // Add the current user as the creator
  req.body.creator = req.user.id;

  // If there's a banner image, add the path
  if (req.file) {
    req.body.bannerImage = req.file.path;
  }

  const event = await Event.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      event
    }
  });
});