"use strict";

var path = require('path');

var express = require('express');

var cors = require('cors');

var xss = require('xss-clean');

var cookieParser = require('cookie-parser');

var rateLimit = require('express-rate-limit');

var morgan = require('morgan');

var AppError = require('./utils/appError');

var GlobalErrorHandler = require('./controllers/errorController');

var _require = require('http'),
    createServer = _require.createServer;

var usersRouter = require('./routes/userRoutes');

var postRoutes = require('./routes/postRoutes');

var friendsRoutes = require('./routes/friendsRoutes');

var messagesRoutes = require('./routes/messagesRoutes');

var chatRoutes = require('./routes/chatRoutes');

var app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
var limiter = rateLimit({
  windowMs: 60 * 60 * 1000 * 24,
  max: 20,
  handler: function handler(request, response, next, options) {
    return response.status(options.statusCode).json({
      status: 'fail ',
      message: 'You can only post 15 posts per day and you have reached the limit. You can post again tomorrow, have fun 😉'
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/posts/createPost', limiter);
app.use(express.json({
  limit: '5000kb'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '5000kb'
}));
app.use(cookieParser());
app.use(xss());
app.set('view engine', 'pug'); // app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'build')));

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/friends', friendsRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.get('/api/v1/test', function (req, res) {
  res.status(200).json({
    status: 'success',
    message: 'API is working correctly'
  });
}); // app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.all('*', function (req, res, next) {
  next(new AppError("Can't find ".concat(req.originalUrl), 404));
});
app.use(GlobalErrorHandler);
var httpServer = createServer(app);

var sio = require('./utils/socket');

sio.init(httpServer, {
  pingTimeout: 60000,
  pingInterval: 60000,
  cors: {
    origin: process.env.FRONTEND_URL
  }
});
exports.httpServer = httpServer;