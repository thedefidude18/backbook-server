const Event = require('../models/eventModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllEvents = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Event.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const events = await features.query;

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.createEvent = catchAsync(async (req, res, next) => {
  // Add creator to the event data
  req.body.creator = req.user.id;
  
  const newEvent = await Event.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      event: newEvent
    }
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is the creator of the event
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to update this event', 403));
  }

  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      event: updatedEvent
    }
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is the creator of the event
  if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to delete this event', 403));
  }

  await Event.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.attendEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is already attending
  if (event.attendees.includes(req.user.id)) {
    return next(new AppError('You are already attending this event', 400));
  }

  event.attendees.push(req.user.id);
  await event.save();

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.unattendEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  // Check if user is attending
  if (!event.attendees.includes(req.user.id)) {
    return next(new AppError('You are not attending this event', 400));
  }

  event.attendees = event.attendees.filter(
    attendee => attendee.toString() !== req.user.id
  );
  await event.save();

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});