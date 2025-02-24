const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { createSendToken } = require('../utils/createSendToken');
const User = require('../models/userModel');
const Friend = require('../models/friendsModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const rateLimiter = require('../utils/rateLimiter');

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      passwordConfirm,
      birth_Year,
      birth_Month,
      birth_Day,
      gender
    } = req.body;

    // Add input sanitization
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name.trim();

    // Add password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character', 400));
    }

    // Add rate limiting for signup attempts (implement with Redis)
    const signupAttempts = await rateLimiter.checkSignupAttempts(req.ip);
    if (signupAttempts > 5) {
      return next(new AppError('Too many signup attempts. Please try again later.', 429));
    }

    const newUser = await User.create({
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      email: sanitizedEmail,
      password,
      passwordConfirm,
      birth_Year,
      birth_Month,
      birth_Day,
      gender,
      username: `${sanitizedFirstName.toLowerCase()}${sanitizedLastName.toLowerCase()}`,
    });

    // Remove sensitive data
    newUser.password = undefined;
    newUser.__v = undefined;

    createSendToken({
      user: newUser,
      statusCode: 201,
      res,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return next(new AppError(error.message || 'Error creating user', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check rate limiting
    const loginAttempts = await rateLimiter.checkLoginAttempts(req.ip, email);
    if (loginAttempts > 5) {
      return next(new AppError('Too many login attempts. Please try again in 15 minutes.', 429));
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: sanitizedEmail }).select(
      '+password first_name last_name username photo verified confirmed recivedRequestsCount unseenMessages unseenNotification'
    );

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Create token and send response
    createSendToken({
      user,
      statusCode: 200,
      res,
    });

  } catch (error) {
    console.error('Login error:', error);
    return next(new AppError('Error during login', 500));
  }
});

exports.ping = catchAsync(async (req, res, next) => {
  const userId = req.user.id.toString();
  const recivedRequestsCount = await Friend.countDocuments({
    recipient: userId,
    status: 'pending',
  });

  res.status(200).json({
    status: 'success',
    recivedRequestsCount,
    unseenMessages: req.user.unseenMessages,
    unseenNotification: req.user.unseenNotification,
    userId,
  });
});

exports.logOut = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'expired', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: false,
    secure: true,
    samesite: 'None',
  });
  res.status(200).json({ status: 'success' });
});

exports.activateAccount = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');

  const user = await User.findOne({
    verificationEmailToken: hashedToken,
  });

  if (!user) return next(new AppError('Invalid or expired token', 400));

  if (user.id !== req.user.id)
    return next(new AppError('Invalid token please try again', 400));

  user.verified = true;
  user.verificationEmailToken = undefined;
  await user.save({ validateBeforeSave: false });

  createSendToken({ user: user, statusCode: 201, res: res });
});

exports.resendEmailVerification = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.verified)
    return next(
      new AppError(
        'Your account is already verified, try logging in again.',
        400
      )
    );

  const verificationEmailToken = user.createVerificationEmailToken();
  await user.save({ validateBeforeSave: false });
  const url = `${process.env.FRONTEND_URL}/activate/${verificationEmailToken}`;

  await new Email(user, url).sendVerificationEmail();
  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) check if token exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not logged in, please log in to access', 401)
    );

  // 2) verifcation token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError('The token does no longer exist', 401));

  // 4) if user change password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password, please login again', 401)
    );

  // GRANT ACCESS
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      req.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.findUser = catchAsync(async (req, res, next) => {
  const { email } = req.query;

  // check if email and password exist
  if (!email) return next(new AppError('Please provide email', 400));

  // check if user exist and password is correct
  const user = await User.findOne({ email });

  if (!user) return next(new AppError('No user found, please try again', 401));

  // is everything okay , send jwt to the client
  res.status(200).json({
    status: 'success',
    data: {
      email: user.email,
      photo: user.photo,
      first_name: user.first_name,
    },
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with these email', 404));

  const resetCode = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });

  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetPassword/${resetCode}`;

  try {
    await new Email(user, resetCode).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log(error);

    return next(
      new AppError(
        'There is an error while sending the email, try again later! ',
        500
      )
    );
  }
});

exports.validateResetCode = catchAsync(async (req, res, next) => {
  const { email, code } = req.body;

  // check if email and password exist
  if (!email || !code)
    return next(new AppError('Please provide email and reset code', 400));

  // check if user exist and password is correct
  const user = await User.findOne({
    email,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  }).select('passwordResetToken');

  if (!user)
    return next(
      new AppError('No user found or token expired, please try again', 401)
    );

  const hashedCode = crypto
    .createHash('sha256')
    .update(code.toString())
    .digest('hex');

  if (user.passwordResetToken !== hashedCode)
    return next(
      new AppError(
        "The number that you've entered doesn't match your code. Please try again.",
        401
      )
    );

  // create token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // is everything okay , send jwt to the client
  res.status(200).json({
    status: 'success',
    data: {
      token: resetToken,
    },
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, email, password, passwordConfirm } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email,
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) return next(new AppError('Invalid or expired TOKEN', 400));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken({ user: user, statusCode: 201, res: res });
});
