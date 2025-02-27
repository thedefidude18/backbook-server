"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.useReferral = void 0;
var react_1 = require("react");
var axios_1 = require("axios");
var hooks_1 = require("../store/hooks");
function useReferral() {
    var _this = this;
    var _a = react_1.useState(null), referralCode = _a[0], setReferralCode = _a[1];
    var _b = react_1.useState({
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        totalRewards: 0
    }), stats = _b[0], setStats = _b[1];
    var currentUser = hooks_1.useAppSelector(function (state) { return state.user.userinfo; });
    var fetchReferralStats = react_1.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentUser)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].get(process.env.REACT_APP_BACKEND_URL + "/api/v1/users/referral/stats", { withCredentials: true })];
                case 2:
                    data = (_a.sent()).data;
                    if (data.status === "success") {
                        setStats({
                            totalReferrals: data.data.totalReferrals || 0,
                            pendingReferrals: data.data.pendingReferrals || 0,
                            completedReferrals: data.data.completedReferrals || 0,
                            totalRewards: data.data.totalRewards || 0
                        });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching referral stats:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [currentUser]);
    var generateReferralCode = react_1.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var existingCodeData, error_2, newCodeData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentUser)
                        return [2 /*return*/, null];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].get(process.env.REACT_APP_BACKEND_URL + "/api/v1/users/referral", { withCredentials: true })];
                case 2:
                    existingCodeData = (_a.sent()).data;
                    if (existingCodeData.status === "success" && existingCodeData.data.code) {
                        setReferralCode(existingCodeData.data.code);
                        return [2 /*return*/, existingCodeData.data.code];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching existing referral code:', error_2);
                    return [3 /*break*/, 4];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, axios_1["default"].post(process.env.REACT_APP_BACKEND_URL + "/api/v1/users/referral/generate", {}, { withCredentials: true })];
                case 5:
                    newCodeData = (_a.sent()).data;
                    if (newCodeData.status === "success" && newCodeData.data.code) {
                        setReferralCode(newCodeData.data.code);
                        return [2 /*return*/, newCodeData.data.code];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    console.error('Error generating referral code:', error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, null];
            }
        });
    }); }, [currentUser]);
    var applyReferralCode = react_1.useCallback(function (code) { return __awaiter(_this, void 0, void 0, function () {
        var data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentUser)
                        return [2 /*return*/, false];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].post(process.env.REACT_APP_BACKEND_URL + "/api/v1/users/referral/apply", { code: code }, { withCredentials: true })];
                case 2:
                    data = (_a.sent()).data;
                    return [2 /*return*/, data.status === "success"];
                case 3:
                    error_4 = _a.sent();
                    console.error('Error applying referral code:', error_4);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [currentUser]);
    react_1.useEffect(function () {
        if (currentUser) {
            generateReferralCode();
            fetchReferralStats();
        }
    }, [currentUser, generateReferralCode, fetchReferralStats]);
    return {
        referralCode: referralCode,
        stats: stats,
        generateReferralCode: generateReferralCode,
        applyReferralCode: applyReferralCode,
        fetchReferralStats: fetchReferralStats
    };
}
exports.useReferral = useReferral;
