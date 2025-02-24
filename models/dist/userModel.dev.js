"use strict";

var mongoose = require('mongoose');

var bcrypt = require('bcryptjs');

var userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'Please tell us your first name!'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  last_name: {
    type: String,
    required: [true, 'Please tell us your last name!'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function validator(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  birth_Year: Number,
  birth_Month: Number,
  birth_Day: Number,
  gender: String,
  verified: {
    type: Boolean,
    "default": false
  },
  confirmed: {
    type: Boolean,
    "default": false
  },
  photo: {
    type: String,
    "default": 'default.png'
  },
  loginAttempts: {
    type: Number,
    "default": 0
  },
  lastFailedLogin: {
    type: Date
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    "default": true,
    select: false
  },
  fcmToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
}); // Add index for email lookups

userSchema.index({
  email: 1
}); // Add password comparison method

userSchema.methods.correctPassword = function _callee(candidatePassword, userPassword) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(bcrypt.compare(candidatePassword, userPassword));

        case 2:
          return _context.abrupt("return", _context.sent);

        case 3:
        case "end":
          return _context.stop();
      }
    }
  });
}; // Add middleware to check password strength on save


userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  var passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(this.password)) {
    next(new Error('Password does not meet security requirements'));
  }

  next();
}); // Hash password before saving

userSchema.pre('save', function _callee2(next) {
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (this.isModified('password')) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return", next());

        case 2:
          _context2.next = 4;
          return regeneratorRuntime.awrap(bcrypt.hash(this.password, 12));

        case 4:
          this.password = _context2.sent;
          this.passwordConfirm = undefined;
          next();

        case 7:
        case "end":
          return _context2.stop();
      }
    }
  }, null, this);
}); // Add method to check if password was changed after token was issued

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    var changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

var User = mongoose.model('User', userSchema);
module.exports = User;