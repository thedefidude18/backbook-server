"use strict";

var mongoose = require('mongoose');

var User = require('../models/userModel');

var Friend = require('../models/friendsModel');

var Reaction = require('../models/reactionModel');

var NotificationModel = require('../models/notificationModel');

var Follow = require('../models/followModel');

var Post = require('../models/postModel');

var catchAsync = require('../utils/catchAsync');

var AppError = require('../utils/appError');

var factory = require('./handlerFactory');

var APIFeatures = require('../utils/apiFeatures');

var _require = require('../utils/cloudinaryHandler'),
    getImages = _require.getImages,
    uploadToCloudinary = _require.uploadToCloudinary;

var multer = require('multer');

var sharp = require('sharp');

var getRelationship = require('../utils/getRelationship');

var multerStorage = multer.memoryStorage();

var multerFilter = function multerFilter(req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images', 400), false);
  }
};

var upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(function _callee(req, res, next) {
  var path, processedImage, filePath;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (req.file) {
            _context.next = 2;
            break;
          }

          return _context.abrupt("return", next());

        case 2:
          path = "".concat(process.env.APP_NAME, "/users/").concat(req.user.id, "/public/profile_photos/");
          _context.next = 5;
          return regeneratorRuntime.awrap(sharp(req.file.buffer).resize(500, 500).toFormat('webp').webp({
            quality: 90
          }).toBuffer());

        case 5:
          processedImage = _context.sent;
          _context.next = 8;
          return regeneratorRuntime.awrap(uploadToCloudinary(processedImage, path));

        case 8:
          filePath = _context.sent;
          req.body.photo = filePath.url;
          next();

        case 11:
        case "end":
          return _context.stop();
      }
    }
  });
});
exports.resizeUserCover = catchAsync(function _callee2(req, res, next) {
  var path, processedImage, filePath;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (req.file) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return", next());

        case 2:
          path = "".concat(process.env.APP_NAME, "/users/").concat(req.user.id, "/public/profile_covers/");
          _context2.next = 5;
          return regeneratorRuntime.awrap(sharp(req.file.buffer).toFormat('webp').webp({
            quality: 90
          }).toBuffer());

        case 5:
          processedImage = _context2.sent;
          _context2.next = 8;
          return regeneratorRuntime.awrap(uploadToCloudinary(processedImage, path));

        case 8:
          filePath = _context2.sent;
          req.body.cover = filePath.url;
          next();

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  });
});

var filterObj = function filterObj(obj) {
  for (var _len = arguments.length, allowed = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    allowed[_key - 1] = arguments[_key];
  }

  var newObj = {};
  Object.keys(obj).forEach(function (el) {
    if (allowed.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getProfile = catchAsync(function _callee3(req, res, next) {
  var username, user, profileID, userID, friendship, friends, users;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          username = req.params.username;
          _context3.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }).select('-search -savedPosts -email'));

        case 3:
          user = _context3.sent;

          if (user) {
            _context3.next = 6;
            break;
          }

          return _context3.abrupt("return", next(new AppError('No user found with that username', 404)));

        case 6:
          profileID = user.id;
          userID = req.user.id;
          _context3.next = 10;
          return regeneratorRuntime.awrap(getRelationship(userID, profileID));

        case 10:
          friendship = _context3.sent;
          _context3.next = 13;
          return regeneratorRuntime.awrap(Friend.find({
            $or: [{
              sender: profileID
            }, {
              recipient: profileID
            }],
            status: 'accepted'
          }).sort({
            createdAt: -1
          }).limit(9).populate({
            path: 'sender recipient',
            select: 'first_name last_name photo username gender cover confirmed'
          }));

        case 13:
          friends = _context3.sent;
          // Map the friend documents to an array of user documents
          users = friends.map(function (friend) {
            if (friend.sender._id.equals(profileID)) {
              return friend.recipient;
            } else {
              return friend.sender;
            }
          });
          res.status(200).json({
            status: 'success',
            data: {
              user: user,
              friendship: friendship,
              friends: users
            }
          });

        case 16:
        case "end":
          return _context3.stop();
      }
    }
  });
});
exports.getPhotos = catchAsync(function _callee4(req, res, next) {
  var username, user, path, photos, resources, profilePhotos, profileCovers;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          username = req.params.username;
          _context4.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }));

        case 3:
          user = _context4.sent;

          if (user) {
            _context4.next = 6;
            break;
          }

          return _context4.abrupt("return", next(new AppError('No user found with that username', 404)));

        case 6:
          path = "".concat(process.env.APP_NAME, "/users/").concat(user.id, "/public/*");
          _context4.next = 9;
          return regeneratorRuntime.awrap(getImages(path, 100, 'desc'));

        case 9:
          photos = _context4.sent;
          resources = photos.resources.map(function (photo) {
            return {
              url: photo.secure_url,
              id: photo.asset_id
            };
          });
          profilePhotos = photos.resources.filter(function (photo) {
            return photo.folder === "".concat(process.env.APP_NAME, "/users/").concat(user.id, "/public/profile_photos");
          }).map(function (photo) {
            return {
              url: photo.secure_url,
              id: photo.asset_id
            };
          });
          profileCovers = photos.resources.filter(function (photo) {
            return photo.folder === "".concat(process.env.APP_NAME, "/users/").concat(user.id, "/public/profile_covers");
          }).map(function (photo) {
            return {
              url: photo.secure_url,
              id: photo.asset_id
            };
          });
          res.status(200).json({
            status: 'success',
            data: {
              total_count: photos.total_count,
              resources: resources,
              profilePhotos: profilePhotos,
              profileCovers: profileCovers
            }
          });

        case 14:
        case "end":
          return _context4.stop();
      }
    }
  });
});
exports.getUserPosts = catchAsync(function _callee5(req, res, next) {
  var username, userID, user, filter, features, posts, ids, reactions, reactionsIds, postsReactions;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          username = req.params.username;
          userID = req.user.id;
          _context5.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }));

        case 4:
          user = _context5.sent;

          if (user) {
            _context5.next = 7;
            break;
          }

          return _context5.abrupt("return", next(new AppError('No user found with that username', 404)));

        case 7:
          filter = {
            user: user.id
          };
          features = new APIFeatures(Post.find(filter), req.query).filter().sort().limitFields().paginate(); // const doc = await features.query.explain();

          _context5.next = 11;
          return regeneratorRuntime.awrap(features.query);

        case 11:
          posts = _context5.sent;
          ids = posts.map(function (el) {
            return el._id.toString();
          });
          _context5.next = 15;
          return regeneratorRuntime.awrap(Reaction.find({
            user: userID,
            post: {
              $in: ids
            }
          }));

        case 15:
          reactions = _context5.sent;
          reactionsIds = reactions.map(function (el) {
            return el.post.toString();
          });
          postsReactions = posts.map(function (post) {
            post.reactions.isLiked = reactionsIds.includes(post._id.toString()) ? reactions.find(function (o) {
              return o.post.toString() === post._id.toString();
            }).type : '';
            return post;
          }); // console.log(reactions);

          res.status(200).json({
            status: 'success',
            length: posts.length,
            data: postsReactions
          });

        case 19:
        case "end":
          return _context5.stop();
      }
    }
  });
});
exports.updatePhoto = catchAsync(function _callee6(req, res, next) {
  var userId, filteredBody;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (!(req.body.password || req.body.passwordConfirm)) {
            _context6.next = 2;
            break;
          }

          return _context6.abrupt("return", next(new AppError('You cant update the passworm from this route', 400)));

        case 2:
          userId = req.user.id;
          filteredBody = filterObj(req.body, 'photo', 'text');
          _context6.next = 6;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(userId, filteredBody, {
            "new": true,
            runValidators: true
          }));

        case 6:
          _context6.next = 8;
          return regeneratorRuntime.awrap(Post.create({
            user: userId,
            type: 'profilePhoto',
            text: filteredBody.text,
            images: [filteredBody.photo]
          }));

        case 8:
          // Send reponse
          res.status(200).json({
            status: 'success',
            data: {
              url: filteredBody.photo
            }
          });

        case 9:
        case "end":
          return _context6.stop();
      }
    }
  });
});
exports.updateCover = catchAsync(function _callee7(req, res, next) {
  var userId, filteredBody;
  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          if (!(req.body.password || req.body.passwordConfirm)) {
            _context7.next = 2;
            break;
          }

          return _context7.abrupt("return", next(new AppError('You cant update the passworm from this route', 400)));

        case 2:
          userId = req.user.id;
          filteredBody = filterObj(req.body, 'cover');
          _context7.next = 6;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(userId, filteredBody, {
            "new": true,
            runValidators: true
          }));

        case 6:
          _context7.next = 8;
          return regeneratorRuntime.awrap(Post.create({
            user: userId,
            type: 'cover',
            images: [filteredBody.cover]
          }));

        case 8:
          // Send reponse
          res.status(200).json({
            status: 'success',
            data: {
              url: filteredBody.cover
            }
          });

        case 9:
        case "end":
          return _context7.stop();
      }
    }
  });
});
exports.updateDetails = catchAsync(function _callee8(req, res, next) {
  var userId, filteredBody, updated;
  return regeneratorRuntime.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          userId = req.user.id;
          filteredBody = filterObj(req.body, 'infos');
          _context8.next = 4;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(userId, {
            details: filteredBody.infos
          }, {
            "new": true,
            runValidators: true
          }));

        case 4:
          updated = _context8.sent;
          // Send reponse
          res.status(200).json({
            status: 'success',
            data: {
              details: updated.details
            }
          });

        case 6:
        case "end":
          return _context8.stop();
      }
    }
  });
});
exports.searchUsers = catchAsync(function _callee9(req, res, next) {
  var term, userId, results, filteredResults;
  return regeneratorRuntime.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          term = req.body.term;
          userId = req.user.id;

          if (term) {
            _context9.next = 4;
            break;
          }

          return _context9.abrupt("return", next(new AppError('Please provide a search term', 400)));

        case 4:
          _context9.next = 6;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              $or: [{
                first_name: {
                  $regex: term.trim(),
                  $options: 'i'
                }
              }, {
                last_name: {
                  $regex: term.trim(),
                  $options: 'i'
                }
              }, {
                email: {
                  $regex: term.trim(),
                  $options: 'i'
                }
              }]
            }
          }, {
            $project: {
              first_name: 1,
              last_name: 1,
              photo: 1
            }
          }]));

        case 6:
          results = _context9.sent;
          filteredResults = results.filter(function (x) {
            return x._id.toString() !== userId;
          }); // Send reponse

          res.status(200).json({
            status: 'success',
            data: {
              results: filteredResults
            }
          });

        case 9:
        case "end":
          return _context9.stop();
      }
    }
  });
});
exports.addToSearchHistory = catchAsync(function _callee10(req, res, next) {
  var userId, searchUser, user, check;
  return regeneratorRuntime.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          userId = req.user.id;
          searchUser = req.body.searchUser;

          if (searchUser) {
            _context10.next = 4;
            break;
          }

          return _context10.abrupt("return", next(new AppError('Please provide a user id : searchUser', 400)));

        case 4:
          _context10.next = 6;
          return regeneratorRuntime.awrap(User.findById(userId));

        case 6:
          user = _context10.sent;
          check = user.search.find(function (x) {
            return x.user.toString() === searchUser;
          });

          if (!check) {
            _context10.next = 13;
            break;
          }

          _context10.next = 11;
          return regeneratorRuntime.awrap(User.updateOne({
            _id: userId,
            'search._id': check._id
          }, {
            $set: {
              'search.$.createdAt': new Date()
            }
          }));

        case 11:
          _context10.next = 15;
          break;

        case 13:
          _context10.next = 15;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(userId, {
            $push: {
              search: {
                user: searchUser
              }
            }
          }));

        case 15:
          res.status(200).json({
            status: 'success',
            message: 'User added to search history'
          });

        case 16:
        case "end":
          return _context10.stop();
      }
    }
  });
});
exports.removeFromSearch = catchAsync(function _callee11(req, res, next) {
  var userId, searchUser, user, check;
  return regeneratorRuntime.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          userId = req.user.id;
          searchUser = req.body.searchUser;

          if (searchUser) {
            _context11.next = 4;
            break;
          }

          return _context11.abrupt("return", next(new AppError('Please provide a user id : searchUser', 400)));

        case 4:
          _context11.next = 6;
          return regeneratorRuntime.awrap(User.findById(userId));

        case 6:
          user = _context11.sent;
          check = user.search.find(function (x) {
            return x.user.toString() === searchUser;
          });

          if (!check) {
            _context11.next = 11;
            break;
          }

          _context11.next = 11;
          return regeneratorRuntime.awrap(User.updateOne({
            _id: userId
          }, {
            $pull: {
              search: {
                user: searchUser
              }
            }
          }));

        case 11:
          res.status(200).json({
            status: 'success',
            message: 'User removed from search history'
          });

        case 12:
        case "end":
          return _context11.stop();
      }
    }
  });
});
exports.getSearchHistory = catchAsync(function _callee12(req, res, next) {
  var userId, searchHistory;
  return regeneratorRuntime.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          userId = req.user.id;
          _context12.next = 3;
          return regeneratorRuntime.awrap(User.aggregate([{
            $match: {
              _id: mongoose.Types.ObjectId(userId)
            }
          }, {
            $unwind: '$search'
          }, {
            $group: {
              _id: '$search.user',
              createdAt: {
                $last: '$search.createdAt'
              }
            }
          }, {
            $sort: {
              createdAt: -1
            }
          }, {
            $replaceRoot: {
              newRoot: {
                _id: '$_id'
              }
            }
          }, {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          }, {
            $project: {
              'user.first_name': 1,
              'user.last_name': 1,
              'user.photo': 1,
              'user.username': 1
            }
          }, {
            $unwind: '$user'
          }]));

        case 3:
          searchHistory = _context12.sent;
          res.status(200).json({
            status: 'success',
            data: {
              results: searchHistory
            }
          });

        case 5:
        case "end":
          return _context12.stop();
      }
    }
  });
});
exports.addFCM = catchAsync(function _callee13(req, res, next) {
  var userId, fcmToken;
  return regeneratorRuntime.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          userId = req.user.id;
          fcmToken = req.body.fcmToken;

          if (fcmToken) {
            _context13.next = 4;
            break;
          }

          return _context13.abrupt("return", next(new AppError('Please provide a fcm token', 400)));

        case 4:
          _context13.next = 6;
          return regeneratorRuntime.awrap(User.updateOne({
            _id: userId
          }, {
            fcmToken: fcmToken
          }));

        case 6:
          res.status(200).json({
            status: 'success',
            message: 'FCM token added',
            fcmToken: fcmToken
          });

        case 7:
        case "end":
          return _context13.stop();
      }
    }
  });
});
exports.getNotification = catchAsync(function _callee14(req, res, next) {
  var userId, notifications, existingUser;
  return regeneratorRuntime.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          userId = req.user.id;
          _context14.next = 3;
          return regeneratorRuntime.awrap(NotificationModel.find({
            recipient: userId
          }).sort('-createdAt'));

        case 3:
          notifications = _context14.sent;
          _context14.next = 6;
          return regeneratorRuntime.awrap(User.findById(userId));

        case 6:
          existingUser = _context14.sent;
          existingUser.unseenNotification = 0;
          _context14.next = 10;
          return regeneratorRuntime.awrap(existingUser.save({
            validateBeforeSave: false
          }));

        case 10:
          res.status(200).json({
            status: 'success',
            data: {
              notifications: notifications
            }
          });

        case 11:
        case "end":
          return _context14.stop();
      }
    }
  });
});
exports.seenNotification = catchAsync(function _callee15(req, res, next) {
  var userId, nid, notification, existingUser;
  return regeneratorRuntime.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          userId = req.user.id;
          nid = req.params.nid;
          console.log(nid);
          _context15.next = 5;
          return regeneratorRuntime.awrap(NotificationModel.findById(nid));

        case 5:
          notification = _context15.sent;

          if (notification) {
            _context15.next = 8;
            break;
          }

          return _context15.abrupt("return", next(new AppError('Notification not found', 404)));

        case 8:
          notification.seen = 'seen';
          _context15.next = 11;
          return regeneratorRuntime.awrap(notification.save());

        case 11:
          _context15.next = 13;
          return regeneratorRuntime.awrap(User.findById(userId));

        case 13:
          existingUser = _context15.sent;
          existingUser.unseenNotification = 0;
          _context15.next = 17;
          return regeneratorRuntime.awrap(existingUser.save({
            validateBeforeSave: false
          }));

        case 17:
          res.status(200).json({
            status: 'success',
            data: {
              notification: notification
            }
          });

        case 18:
        case "end":
          return _context15.stop();
      }
    }
  });
});
exports.updateFCMToken = catchAsync(function _callee16(req, res, next) {
  var fcmToken, user;
  return regeneratorRuntime.async(function _callee16$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
        case 0:
          fcmToken = req.body.fcmToken;

          if (fcmToken) {
            _context16.next = 3;
            break;
          }

          return _context16.abrupt("return", next(new AppError('FCM token is required', 400)));

        case 3:
          _context16.next = 5;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.user.id, {
            fcmToken: fcmToken
          }, {
            "new": true,
            runValidators: true
          }));

        case 5:
          user = _context16.sent;
          res.status(200).json({
            status: 'success',
            data: {
              fcmToken: user.fcmToken
            }
          });

        case 7:
        case "end":
          return _context16.stop();
      }
    }
  });
});