const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'An event must have a name'],
      trim: true,
      maxlength: [100, 'An event name must have less or equal than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'An event description must have less or equal than 1000 characters']
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    location: {
      type: String,
      required: [true, 'An event must have a location']
    },
    startDate: {
      type: Date,
      required: [true, 'An event must have a start date']
    },
    endDate: {
      type: Date
    },
    bannerImage: {
      type: String
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An event must have a creator']
    },
    attendees: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual populate
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees.length;
});

// Populate creator and attendees on find
eventSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'creator',
    select: 'first_name last_name picture username'
  });
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;