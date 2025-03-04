"use strict";

var jwt = require('jsonwebtoken');

var signToken = function signToken(id) {
  return jwt.sign({
    id: id
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.createSendToken = function (_ref) {
  var user = _ref.user,
      statusCode = _ref.statusCode,
      res = _ref.res;
  var token = signToken(user._id);
  var cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  };
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    data: {
      token: token,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        photo: user.photo,
        verified: user.verified,
        confirmed: user.confirmed,
        recivedRequestsCount: user.recivedRequestsCount,
        unseenMessages: user.unseenMessages,
        unseenNotification: user.unseenNotification
      }
    }
  });
};