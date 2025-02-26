const mongoose = require('mongoose');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Notification = require('../utils/notification');

const ObjectId = mongoose.Types.ObjectId;

// Create a new challenge
exports.createChallenge = catchAsync(async (req, res, next) => {
  const initiator = req.user.id;
  const { userId, title, description, startDate, endDate, reward } = req.body;

  if (!userId || !title || !description || !startDate || !endDate) {
    return next(new AppError('Please provide all required challenge details', 400));
  }

  // Check if target user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return next(new AppError('Target user not found', 404));
  }

  // Prevent challenging yourself
  if (initiator === userId) {
    return next(new AppError('You cannot challenge yourself', 400));
  }

  // Create a new challenge chat
  const newChallenge = await Chat.create({
    chatName: title,
    type: 'challenge',
    users: [initiator, userId],
    challengeDetails: {
      title,
      description,
      startDate,
      endDate,
      reward: reward || '',
      status: 'pending',
      initiator
    },
    photo: req.file ? req.file.path : 'https://res.cloudinary.com/dcu2kxr5x/image/upload/v1675105115/BACKBOOK/assets/group_fu7eoo.png'
  });

  // Create an info message about the challenge
  const infoMessage = await Message.create({
    type: 'info',
    content: `${req.user.first_name} ${req.user.last_name} has challenged you to: ${title}`,
    chat: newChallenge._id,
    sender: initiator
  });

  // Update the latest message
  newChallenge.latestMessage = infoMessage._id;
  await newChallenge.save();

  // Send notification to the challenged user
  const notification = {
    type: 'challenge',
    sender: initiator,
    receiver: userId,
    text: `challenged you to: ${title}`,
    link: `/messages?id=${newChallenge._id}`
  };

  await Notification.createNotification(notification);

  // Populate the challenge with user details
  const populatedChallenge = await Chat.findById(newChallenge._id).populate({
    path: 'users',
    select: 'first_name last_name photo username gender confirmed'
  });

  res.status(201).json({
    status: 'success',
    data: {
      challenge: populatedChallenge
    }
  });
});

// Accept a challenge
exports.respondToChallenge = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { challengeId, action } = req.body;

  if (!challengeId || !action) {
    return next(new AppError('Please provide challengeId and action', 400));
  }

  if (!['accept', 'decline'].includes(action)) {
    return next(new AppError('Action must be either accept or decline', 400));
  }

  // Find the challenge
  const challenge = await Chat.findOne({
    _id: challengeId,
    type: 'challenge',
    users: { $elemMatch: { $eq: userId } }
  });

  if (!challenge) {
    return next(new AppError('Challenge not found or you are not part of this challenge', 404));
  }

  // Check if user is the one being challenged (not the initiator)
  if (challenge.challengeDetails.initiator.toString() === userId) {
    return next(new AppError('You cannot respond to your own challenge', 400));
  }

  // Update challenge status
  challenge.challengeDetails.status = action === 'accept' ? 'accepted' : 'declined';
  await challenge.save();

  // Create an info message about the response
  const infoMessage = await Message.create({
    type: 'info',
    content: `${req.user.first_name} ${req.user.last_name} has ${action}ed the challenge: ${challenge.challengeDetails.title}`,
    chat: challenge._id,
    sender: userId
  });

  // Update the latest message
  challenge.latestMessage = infoMessage._id;
  await challenge.save();

  // Send notification to the initiator
  const notification = {
    type: 'challenge_response',
    sender: userId,
    receiver: challenge.challengeDetails.initiator,
    text: `${action}ed your challenge: ${challenge.challengeDetails.title}`,
    link: `/messages?id=${challenge._id}`
  };

  await Notification.createNotification(notification);

  res.status(200).json({
    status: 'success',
    data: {
      challenge
    }
  });
});

// Complete a challenge
exports.completeChallenge = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { challengeId } = req.params;

  // Find the challenge
  const challenge = await Chat.findOne({
    _id: challengeId,
    type: 'challenge',
    users: { $elemMatch: { $eq: userId } }
  });

  if (!challenge) {
    return next(new AppError('Challenge not found or you are not part of this challenge', 404));
  }

  if (challenge.challengeDetails.status !== 'accepted') {
    return next(new AppError('Challenge must be accepted before it can be completed', 400));
  }

  // Update challenge status
  challenge.challengeDetails.status = 'completed';
  await challenge.save();

  // Create an info message about completion
  const infoMessage = await Message.create({
    type: 'info',
    content: `${req.user.first_name} ${req.user.last_name} has marked the challenge as completed`,
    chat: challenge._id,
    sender: userId
  });

  // Update the latest message
  challenge.latestMessage = infoMessage._id;
  await challenge.save();

  // Notify the other participant
  const otherParticipant = challenge.users.find(
    user => user.toString() !== userId
  );

  const notification = {
    type: 'challenge_completed',
    sender: userId,
    receiver: otherParticipant,
    text: `marked your challenge as completed: ${challenge.challengeDetails.title}`,
    link: `/messages?id=${challenge._id}`
  };

  await Notification.createNotification(notification);

  res.status(200).json({
    status: 'success',
    data: {
      challenge
    }
  });
});

// Get all challenges for a user
exports.getUserChallenges = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const challenges = await Chat.find({
    type: 'challenge',
    users: { $elemMatch: { $eq: userId } }
  }).populate({
    path: 'users challengeDetails.initiator',
    select: 'first_name last_name photo username gender confirmed'
  }).sort('-updatedAt');

  // Categorize challenges
  const active = challenges.filter(c => 
    c.challengeDetails.status === 'accepted' && 
    new Date(c.challengeDetails.endDate) >= new Date()
  );
  
  const pending = challenges.filter(c => 
    c.challengeDetails.status === 'pending'
  );
  
  const completed = challenges.filter(c => 
    c.challengeDetails.status === 'completed' || 
    (c.challengeDetails.status === 'accepted' && new Date(c.challengeDetails.endDate) < new Date())
  );
  
  const declined = challenges.filter(c => 
    c.challengeDetails.status === 'declined' || 
    c.challengeDetails.status === 'cancelled'
  );

  res.status(200).json({
    status: 'success',
    data: {
      challenges: {
        active,
        pending,
        completed,
        declined
      }
    }
  });
});