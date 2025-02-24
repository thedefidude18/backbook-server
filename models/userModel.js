const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'Please tell us your first name!'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  last_name: {
    type: String,
    required: [true, 'Please tell us your last name!'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  birth_Year: Number,
  birth_Month: Number,
  birth_Day: Number,
  gender: String,
  verified: {
    type: Boolean,
    default: false,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
    default: 'default.png',
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: {
    type: Date
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
}, {
  timestamps: true,
});

// Add index for email lookups
userSchema.index({ email: 1 });

// Add middleware to check password strength on save
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(this.password)) {
    next(new Error('Password does not meet security requirements'));
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
