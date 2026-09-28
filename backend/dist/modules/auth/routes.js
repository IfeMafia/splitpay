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
const express_1 = require("express");
const authController = __importStar(require("./controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const validators_1 = require("./validators");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validateBody)(validators_1.registerSchema), authController.register);
router.post('/login', (0, validate_1.validateBody)(validators_1.loginSchema), authController.login);
router.post('/google', (0, validate_1.validateBody)(validators_1.googleAuthSchema), authController.googleAuth);
router.post('/forgot-password', (0, validate_1.validateBody)(validators_1.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', (0, validate_1.validateBody)(validators_1.resetPasswordSchema), authController.resetPassword);
router.post('/logout', auth_1.authenticate, authController.logout);
router.get('/me', auth_1.authenticate, authController.getMe);
exports.default = router;
//# sourceMappingURL=routes.js.map