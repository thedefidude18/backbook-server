"use strict";

var express = require('express');

var rateLimit = require('express-rate-limit');

var morgan = require('morgan');

var cookieParser = require('cookie-parser');

var cors = require('cors');

var xss = require('xss-clean');

var http = require('http');

var app = express(); // Add a global rate limiter for all API routes

var globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: function handler(request, response, next, options) {
    return response.status(options.statusCode).json({
      status: 'fail',
      message: 'Too many requests, please try again later.'
    });
  }
}); // Create a specific limiter for post creation

var postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 5,
  // Limit each IP to 5 post creations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many posts created from this IP, please try again after 15 minutes'
}); // Apply the global rate limiter to all API routes

app.use('/api/v1/', globalLimiter); // Apply the specific rate limiter for post creation

app.use('/api/v1/posts/createPost', postLimiter); // Add CORS middleware

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
})); // Add other middleware

app.use(express.json({
  limit: '10mb'
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(xss()); // Create HTTP server

var httpServer = http.createServer(app); // Export both app and httpServer

module.exports = {
  app: app,
  httpServer: httpServer
};