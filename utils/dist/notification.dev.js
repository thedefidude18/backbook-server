"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var NotificationModel = require('../models/notificationModel');

module.exports =
/*#__PURE__*/
function () {
  function Notification(_ref) {
    var recipient = _ref.recipient,
        sender = _ref.sender,
        postId = _ref.postId,
        postReact = _ref.postReact;

    _classCallCheck(this, Notification);

    this.sender = sender;
    this.recipient = recipient;
    this.postId = postId;
    this.postReact = postReact;
  }

  _createClass(Notification, [{
    key: "send",
    value: function send(_ref2) {
      var body, click, type, path, NotiType, newNotification;
      return regeneratorRuntime.async(function send$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              body = _ref2.body, click = _ref2.click, type = _ref2.type, path = _ref2.path, NotiType = _ref2.NotiType;
              newNotification = null;

              if (!(NotiType !== 'message')) {
                _context.next = 8;
                break;
              }

              _context.next = 5;
              return regeneratorRuntime.awrap(NotificationModel.create({
                sender: this.sender._id,
                recipient: this.recipient._id,
                type: type,
                click: path,
                content: body
              }));

            case 5:
              newNotification = _context.sent;
              _context.next = 8;
              return regeneratorRuntime.awrap(newNotification.save());

            case 8:
              return _context.abrupt("return", newNotification);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "sendPostReact",
    value: function sendPostReact() {
      var postLink, path, noti;
      return regeneratorRuntime.async(function sendPostReact$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              postLink = "".concat(process.env.FRONTEND_URL, "/").concat(this.recipient.username, "/posts/").concat(this.postId);
              path = "/".concat(this.recipient.username, "/posts/").concat(this.postId);
              _context2.next = 4;
              return regeneratorRuntime.awrap(this.send({
                body: "".concat(this.sender.first_name, " reacted ").concat(this.postReact, " on your post"),
                click: postLink,
                type: 'react',
                path: path
              }));

            case 4:
              noti = _context2.sent;
              return _context2.abrupt("return", noti);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "sendPostComment",
    value: function sendPostComment() {
      var postLink, path, noti;
      return regeneratorRuntime.async(function sendPostComment$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              postLink = "".concat(process.env.FRONTEND_URL, "/").concat(this.recipient.username, "/posts/").concat(this.postId);
              path = "/".concat(this.recipient.username, "/posts/").concat(this.postId);
              _context3.next = 4;
              return regeneratorRuntime.awrap(this.send({
                body: "".concat(this.sender.first_name, " commented ").concat(this.postReact, " on your post"),
                click: postLink,
                type: 'comment',
                path: path
              }));

            case 4:
              noti = _context3.sent;
              return _context3.abrupt("return", noti);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "sendCommentLike",
    value: function sendCommentLike() {
      var postLink, path, noti;
      return regeneratorRuntime.async(function sendCommentLike$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              postLink = "".concat(process.env.FRONTEND_URL, "/").concat(this.recipient.username, "/posts/").concat(this.postId);
              path = "/".concat(this.recipient.username, "/posts/").concat(this.postId);
              _context4.next = 4;
              return regeneratorRuntime.awrap(this.send({
                body: "".concat(this.sender.first_name, " reacted like to your comment"),
                click: postLink,
                type: 'react',
                path: path
              }));

            case 4:
              noti = _context4.sent;
              return _context4.abrupt("return", noti);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "sendFollow",
    value: function sendFollow() {
      var postLink, path, noti;
      return regeneratorRuntime.async(function sendFollow$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              postLink = "".concat(process.env.FRONTEND_URL, "/profile/").concat(this.sender.username);
              path = "/profile/".concat(this.sender.username);
              _context5.next = 4;
              return regeneratorRuntime.awrap(this.send({
                body: "".concat(this.sender.first_name, " Followed you"),
                click: postLink,
                type: 'follow',
                path: path
              }));

            case 4:
              noti = _context5.sent;
              return _context5.abrupt("return", noti);

            case 6:
            case "end":
              return _context5.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "sendMessage",
    value: function sendMessage() {
      var link, path, noti;
      return regeneratorRuntime.async(function sendMessage$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              link = "".concat(process.env.FRONTEND_URL, "/messages/").concat(this.postId);
              path = "/messages/".concat(this.postId);
              _context6.next = 4;
              return regeneratorRuntime.awrap(this.send({
                body: "".concat(this.sender.first_name, " sent you a message : ").concat(this.postReact),
                click: link,
                type: 'follow',
                path: path,
                NotiType: 'message'
              }));

            case 4:
              noti = _context6.sent;
              return _context6.abrupt("return", noti);

            case 6:
            case "end":
              return _context6.stop();
          }
        }
      }, null, this);
    }
  }]);

  return Notification;
}();