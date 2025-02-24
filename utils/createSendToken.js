const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createSendToken = ({ user, statusCode, res, recivedRequestsCount }) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    data: {
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo: user.photo,
        verified: user.verified,
        confirmed: user.confirmed,
        recivedRequestsCount,
        unseenMessages: user.unseenMessages,
        unseenNotification: user.unseenNotification,
      },
      token,
    },
  });
};
