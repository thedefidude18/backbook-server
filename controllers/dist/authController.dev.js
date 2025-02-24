"use strict";

var crypto = require('crypto');

var _require = require('util'),
    promisify = _require.promisify;

var jwt = require('jsonwebtoken');

var _require2 = require('../utils/createSendToken'),
    createSendToken = _require2.createSendToken;

var User = require('../models/userModel');

var Friend = require('../models/friendsModel');

var catchAsync = require('../utils/catchAsync');

var AppError = require('../utils/appError');

var Email = require('../utils/email');

var rateLimiter = require('../utils/rateLimiter');

exports.signup = catchAsync(function _callee(req, res, next) {
  var _req$body, first_name, last_name, email, password, passwordConfirm, birth_Year, birth_Month, birth_Day, gender, sanitizedEmail, sanitizedFirstName, sanitizedLastName, passwordRegex, signupAttempts, newUser;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, first_name = _req$body.first_name, last_name = _req$body.last_name, email = _req$body.email, password = _req$body.password, passwordConfirm = _req$body.passwordConfirm, birth_Year = _req$body.birth_Year, birth_Month = _req$body.birth_Month, birth_Day = _req$body.birth_Day, gender = _req$body.gender; // Add input sanitization

          sanitizedEmail = email.toLowerCase().trim();
          sanitizedFirstName = first_name.trim();
          sanitizedLastName = last_name.trim(); // Add password strength validation

          passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

          if (passwordRegex.test(password)) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", next(new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character', 400)));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(rateLimiter.checkSignupAttempts(req.ip));

        case 10:
          signupAttempts = _context.sent;

          if (!(signupAttempts > 5)) {
            _context.next = 13;
            break;
          }

          return _context.abrupt("return", next(new AppError('Too many signup attempts. Please try again later.', 429)));

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(User.create({
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            email: sanitizedEmail,
            password: password,
            passwordConfirm: passwordConfirm,
            birth_Year: birth_Year,
            birth_Month: birth_Month,
            birth_Day: birth_Day,
            gender: gender,
            username: "".concat(sanitizedFirstName.toLowerCase()).concat(sanitizedLastName.toLowerCase())
          }));

        case 15:
          newUser = _context.sent;
          // Remove sensitive data
          newUser.password = undefined;
          newUser.__v = undefined;
          createSendToken({
            user: newUser,
            statusCode: 201,
            res: res
          });
          _context.next = 25;
          break;

        case 21:
          _context.prev = 21;
          _context.t0 = _context["catch"](0);
          console.error('Signup error:', _context.t0);
          return _context.abrupt("return", next(new AppError(_context.t0.message || 'Error creating user', 500)));

        case 25:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 21]]);
});
exports.login = catchAsync(function _callee2(req, res, next) {
  var _req$body2, email, password, loginAttempts, sanitizedEmail, user;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
          console.log('Login attempt:', {
            email: email
          });

          if (!(!email || !password)) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt("return", next(new AppError('Please provide email and password', 400)));

        case 5:
          _context2.next = 7;
          return regeneratorRuntime.awrap(rateLimiter.checkLoginAttempts(req.ip, email));

        case 7:
          loginAttempts = _context2.sent;

          if (!(loginAttempts > 5)) {
            _context2.next = 10;
            break;
          }

          return _context2.abrupt("return", next(new AppError('Too many login attempts. Please try again in 15 minutes.', 429)));

        case 10:
          // Sanitize email
          sanitizedEmail = email.toLowerCase().trim();
          _context2.next = 13;
          return regeneratorRuntime.awrap(User.findOne({
            email: sanitizedEmail
          }).select('+password first_name last_name username photo verified confirmed recivedRequestsCount unseenMessages unseenNotification'));

        case 13:
          user = _context2.sent;
          _context2.t0 = !user;

          if (_context2.t0) {
            _context2.next = 19;
            break;
          }

          _context2.next = 18;
          return regeneratorRuntime.awrap(user.correctPassword(password, user.password));

        case 18:
          _context2.t0 = !_context2.sent;

        case 19:
          if (!_context2.t0) {
            _context2.next = 21;
            break;
          }

          return _context2.abrupt("return", next(new AppError('Incorrect email or password', 401)));

        case 21:
          // Create token and send response
          createSendToken({
            user: user,
            statusCode: 200,
            res: res
          });
          _context2.next = 28;
          break;

        case 24:
          _context2.prev = 24;
          _context2.t1 = _context2["catch"](0);
          console.error('Login error:', _context2.t1);
          return _context2.abrupt("return", next(new AppError('Error during login', 500)));

        case 28:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 24]]);
});
exports.ping = catchAsync(function _callee3(req, res, next) {
  var userId, recivedRequestsCount;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          userId = req.user.id.toString();
          _context3.next = 3;
          return regeneratorRuntime.awrap(Friend.countDocuments({
            recipient: userId,
            status: 'pending'
          }));

        case 3:
          recivedRequestsCount = _context3.sent;
          res.status(200).json({
            status: 'success',
            recivedRequestsCount: recivedRequestsCount,
            unseenMessages: req.user.unseenMessages,
            unseenNotification: req.user.unseenNotification,
            userId: userId
          });

        case 5:
        case "end":
          return _context3.stop();
      }
    }
  });
});
exports.logOut = catchAsync(function _callee4(req, res, next) {
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          res.cookie('jwt', 'expired', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: false,
            secure: true,
            samesite: 'None'
          });
          res.status(200).json({
            status: 'success'
          });

        case 2:
        case "end":
          return _context4.stop();
      }
    }
  });
});
exports.activateAccount = catchAsync(function _callee5(req, res, next) {
  var hashedToken, user;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
          _context5.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            verificationEmailToken: hashedToken
          }));

        case 3:
          user = _context5.sent;

          if (user) {
            _context5.next = 6;
            break;
          }

          return _context5.abrupt("return", next(new AppError('Invalid or expired token', 400)));

        case 6:
          if (!(user.id !== req.user.id)) {
            _context5.next = 8;
            break;
          }

          return _context5.abrupt("return", next(new AppError('Invalid token please try again', 400)));

        case 8:
          user.verified = true;
          user.verificationEmailToken = undefined;
          _context5.next = 12;
          return regeneratorRuntime.awrap(user.save({
            validateBeforeSave: false
          }));

        case 12:
          createSendToken({
            user: user,
            statusCode: 201,
            res: res
          });

        case 13:
        case "end":
          return _context5.stop();
      }
    }
  });
});
exports.resendEmailVerification = catchAsync(function _callee6(req, res, next) {
  var user, verificationEmailToken, url;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(User.findById(req.user.id));

        case 2:
          user = _context6.sent;

          if (!user.verified) {
            _context6.next = 5;
            break;
          }

          return _context6.abrupt("return", next(new AppError('Your account is already verified, try logging in again.', 400)));

        case 5:
          verificationEmailToken = user.createVerificationEmailToken();
          _context6.next = 8;
          return regeneratorRuntime.awrap(user.save({
            validateBeforeSave: false
          }));

        case 8:
          url = "".concat(process.env.FRONTEND_URL, "/activate/").concat(verificationEmailToken);
          _context6.next = 11;
          return regeneratorRuntime.awrap(new Email(user, url).sendVerificationEmail());

        case 11:
          res.status(200).json({
            status: 'success'
          });

        case 12:
        case "end":
          return _context6.stop();
      }
    }
  });
});
exports.protect = catchAsync(function _callee7(req, res, next) {
  var token, decoded, currentUser;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          // 1) check if token exist
          if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
          } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
          }

          if (token) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt("return", next(new AppError('You are not logged in, please log in to access', 401)));

        case 3:
          _context7.next = 5;
          return regeneratorRuntime.awrap(promisify(jwt.verify)(token, process.env.JWT_SECRET));

        case 5:
          decoded = _context7.sent;
          _context7.next = 8;
          return regeneratorRuntime.awrap(User.findById(decoded.id));

        case 8:
          currentUser = _context7.sent;

          if (currentUser) {
            _context7.next = 11;
            break;
          }

          return _context7.abrupt("return", next(new AppError('The token does no longer exist', 401)));

        case 11:
          if (!currentUser.changedPasswordAfter(decoded.iat)) {
            _context7.next = 13;
            break;
          }

          return _context7.abrupt("return", next(new AppError('User recently changed password, please login again', 401)));

        case 13:
          // GRANT ACCESS
          req.user = currentUser;
          next();

        case 15:
        case "end":
          return _context7.stop();
      }
    }
  });
});

exports.isLoggedIn = function _callee8(req, res, next) {
  var decoded, currentUser;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          if (!req.cookies.jwt) {
            _context8.next = 19;
            break;
          }

          _context8.prev = 1;
          _context8.next = 4;
          return regeneratorRuntime.awrap(promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET));

        case 4:
          decoded = _context8.sent;
          _context8.next = 7;
          return regeneratorRuntime.awrap(User.findById(decoded.id));

        case 7:
          currentUser = _context8.sent;

          if (currentUser) {
            _context8.next = 10;
            break;
          }

          return _context8.abrupt("return", next());

        case 10:
          if (!currentUser.changedPasswordAfter(decoded.iat)) {
            _context8.next = 12;
            break;
          }

          return _context8.abrupt("return", next());

        case 12:
          req.user = currentUser;
          return _context8.abrupt("return", next());

        case 16:
          _context8.prev = 16;
          _context8.t0 = _context8["catch"](1);
          return _context8.abrupt("return", next());

        case 19:
          next();

        case 20:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[1, 16]]);
};

exports.findUser = catchAsync(function _callee9(req, res, next) {
  var email, user;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          email = req.query.email; // check if email and password exist

          if (email) {
            _context9.next = 3;
            break;
          }

          return _context9.abrupt("return", next(new AppError('Please provide email', 400)));

        case 3:
          _context9.next = 5;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 5:
          user = _context9.sent;

          if (user) {
            _context9.next = 8;
            break;
          }

          return _context9.abrupt("return", next(new AppError('No user found, please try again', 401)));

        case 8:
          // is everything okay , send jwt to the client
          res.status(200).json({
            status: 'success',
            data: {
              email: user.email,
              photo: user.photo,
              first_name: user.first_name
            }
          });

        case 9:
        case "end":
          return _context9.stop();
      }
    }
  });
});
exports.forgotPassword = catchAsync(function _callee10(req, res, next) {
  var user, resetCode;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.next = 2;
          return regeneratorRuntime.awrap(User.findOne({
            email: req.body.email
          }));

        case 2:
          user = _context10.sent;

          if (user) {
            _context10.next = 5;
            break;
          }

          return _context10.abrupt("return", next(new AppError('There is no user with these email', 404)));

        case 5:
          resetCode = user.createPasswordResetCode();
          _context10.next = 8;
          return regeneratorRuntime.awrap(user.save({
            validateBeforeSave: false
          }));

        case 8:
          _context10.prev = 8;
          _context10.next = 11;
          return regeneratorRuntime.awrap(new Email(user, resetCode).sendPasswordReset());

        case 11:
          res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
          });
          _context10.next = 22;
          break;

        case 14:
          _context10.prev = 14;
          _context10.t0 = _context10["catch"](8);
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          _context10.next = 20;
          return regeneratorRuntime.awrap(user.save({
            validateBeforeSave: false
          }));

        case 20:
          console.log(_context10.t0);
          return _context10.abrupt("return", next(new AppError('There is an error while sending the email, try again later! ', 500)));

        case 22:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[8, 14]]);
});
exports.validateResetCode = catchAsync(function _callee11(req, res, next) {
  var _req$body3, email, code, user, hashedCode, resetToken;

  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _req$body3 = req.body, email = _req$body3.email, code = _req$body3.code; // check if email and password exist

          if (!(!email || !code)) {
            _context11.next = 3;
            break;
          }

          return _context11.abrupt("return", next(new AppError('Please provide email and reset code', 400)));

        case 3:
          _context11.next = 5;
          return regeneratorRuntime.awrap(User.findOne({
            email: email,
            passwordResetExpires: {
              $gt: Date.now()
            }
          }).select('passwordResetToken'));

        case 5:
          user = _context11.sent;

          if (user) {
            _context11.next = 8;
            break;
          }

          return _context11.abrupt("return", next(new AppError('No user found or token expired, please try again', 401)));

        case 8:
          hashedCode = crypto.createHash('sha256').update(code.toString()).digest('hex');

          if (!(user.passwordResetToken !== hashedCode)) {
            _context11.next = 11;
            break;
          }

          return _context11.abrupt("return", next(new AppError("The number that you've entered doesn't match your code. Please try again.", 401)));

        case 11:
          // create token
          resetToken = user.createPasswordResetToken();
          _context11.next = 14;
          return regeneratorRuntime.awrap(user.save({
            validateBeforeSave: false
          }));

        case 14:
          // is everything okay , send jwt to the client
          res.status(200).json({
            status: 'success',
            data: {
              token: resetToken
            }
          });

        case 15:
        case "end":
          return _context11.stop();
      }
    }
  });
});
exports.resetPassword = catchAsync(function _callee12(req, res, next) {
  var _req$body4, token, email, password, passwordConfirm, hashedToken, user;

  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          _req$body4 = req.body, token = _req$body4.token, email = _req$body4.email, password = _req$body4.password, passwordConfirm = _req$body4.passwordConfirm;
          hashedToken = crypto.createHash('sha256').update(token).digest('hex');
          _context12.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            email: email,
            passwordResetToken: hashedToken,
            passwordResetExpires: {
              $gt: Date.now()
            }
          }));

        case 4:
          user = _context12.sent;

          if (user) {
            _context12.next = 7;
            break;
          }

          return _context12.abrupt("return", next(new AppError('Invalid or expired TOKEN', 400)));

        case 7:
          user.password = password;
          user.passwordConfirm = passwordConfirm;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          _context12.next = 13;
          return regeneratorRuntime.awrap(user.save());

        case 13:
          createSendToken({
            user: user,
            statusCode: 201,
            res: res
          });

        case 14:
        case "end":
          return _context12.stop();
      }
    }
  });
});