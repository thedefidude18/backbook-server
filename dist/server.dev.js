"use strict";

var mongoose = require('mongoose');

var dotenv = require('dotenv');

process.on('uncaughtException', function (err) {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});
dotenv.config({
  path: './.env'
});

var _require = require('./app'),
    httpServer = _require.httpServer;

mongoose.set('strictQuery', false);
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('DB connection successful!');
})["catch"](function (err) {
  console.log('DB Connection Error: ', err);
  process.exit(1);
});
var port = process.env.PORT || 3000;
var server = httpServer.listen(port, function () {
  console.log("App running on port ".concat(port, "..."));
});
process.on('unhandledRejection', function (err) {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message); // server.close(() => {
  //   process.exit(1);
  // });
});