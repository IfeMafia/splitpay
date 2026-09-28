"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.getMe = getMe;
exports.googleAuth = googleAuth;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const authService = __importStar(require("./service"));
async function register(req, res, next) {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            data: result,
            message: 'Account registered successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            data: result,
            message: 'Logged in successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function logout(_req, res, next) {
    try {
        // In stateless JWT auth, client clears token from storage
        res.status(200).json({
            message: 'Logged out successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await authService.getCurrentUser(req.user.id);
        res.status(200).json({
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
}
async function googleAuth(req, res, next) {
    try {
        const result = await authService.googleAuth(req.body);
        res.status(200).json({
            data: result,
            message: 'Authenticated with Google successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function forgotPassword(req, res, next) {
    try {
        const result = await authService.forgotPassword(req.body);
        res.status(200).json({
            data: result,
            message: result.message,
        });
    }
    catch (err) {
        next(err);
    }
}
async function resetPassword(req, res, next) {
    try {
        const result = await authService.resetPassword(req.body);
        res.status(200).json({
            data: result,
            message: result.message,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map