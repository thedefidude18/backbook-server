"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RateLimiter =
/*#__PURE__*/
function () {
  function RateLimiter() {
    _classCallCheck(this, RateLimiter);

    this.inMemoryStore = new Map();
  }

  _createClass(RateLimiter, [{
    key: "checkLoginAttempts",
    value: function checkLoginAttempts(ip, email) {
      var _this = this;

      var key, now, record;
      return regeneratorRuntime.async(function checkLoginAttempts$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              key = "login:".concat(ip, ":").concat(email);
              now = Date.now();
              record = this.inMemoryStore.get(key) || {
                attempts: 0,
                timestamp: now
              }; // Reset attempts if 15 minutes have passed

              if (now - record.timestamp > 15 * 60 * 1000) {
                record.attempts = 0;
                record.timestamp = now;
              }

              record.attempts++;
              this.inMemoryStore.set(key, record); // Automatically delete the record after 15 minutes

              setTimeout(function () {
                return _this.inMemoryStore["delete"](key);
              }, 15 * 60 * 1000);
              return _context.abrupt("return", record.attempts);

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "checkSignupAttempts",
    value: function checkSignupAttempts(ip) {
      var _this2 = this;

      var key, now, record;
      return regeneratorRuntime.async(function checkSignupAttempts$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              key = "signup:".concat(ip);
              now = Date.now();
              record = this.inMemoryStore.get(key) || {
                attempts: 0,
                timestamp: now
              }; // Reset attempts if 1 hour has passed

              if (now - record.timestamp > 60 * 60 * 1000) {
                record.attempts = 0;
                record.timestamp = now;
              }

              record.attempts++;
              this.inMemoryStore.set(key, record); // Automatically delete the record after 1 hour

              setTimeout(function () {
                return _this2.inMemoryStore["delete"](key);
              }, 60 * 60 * 1000);
              return _context2.abrupt("return", record.attempts);

            case 8:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }]);

  return RateLimiter;
}();

module.exports = new RateLimiter();