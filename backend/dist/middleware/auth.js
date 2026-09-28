"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requirePoolMember = requirePoolMember;
exports.requirePoolOwner = requirePoolOwner;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new errorHandler_1.AppError(401, 'Missing or invalid Authorization header', 'UNAUTHORIZED'));
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = { id: payload.id, email: payload.email };
        next();
    }
    catch {
        next(new errorHandler_1.AppError(401, 'Token is invalid or expired', 'UNAUTHORIZED'));
    }
}
function optionalAuthenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = { id: payload.id, email: payload.email };
    }
    catch {
        // Ignore invalid token for optional auth
    }
    next();
}
/**
 * Ensures the authenticated user belongs to the specified pool in req.params.poolId
 */
function requirePoolMember(req, _res, next) {
    if (!req.user) {
        return next(new errorHandler_1.AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }
    const poolId = req.params.poolId;
    if (!poolId) {
        return next(new errorHandler_1.AppError(400, 'poolId parameter is missing', 'BAD_REQUEST'));
    }
    prisma_1.prisma.poolMember.findUnique({
        where: {
            poolId_userId: {
                poolId,
                userId: req.user.id,
            },
        },
        include: {
            pool: true,
        },
    }).then((member) => {
        if (!member) {
            return next(new errorHandler_1.AppError(403, 'You are not a member of this Pool', 'FORBIDDEN'));
        }
        req.poolMember = member;
        req.pool = member.pool;
        next();
    }).catch(next);
}
/**
 * Ensures the authenticated user is an OWNER of the specified pool
 */
function requirePoolOwner(req, _res, next) {
    if (!req.user) {
        return next(new errorHandler_1.AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    }
    const poolId = req.params.poolId;
    if (!poolId) {
        return next(new errorHandler_1.AppError(400, 'poolId parameter is missing', 'BAD_REQUEST'));
    }
    prisma_1.prisma.poolMember.findUnique({
        where: {
            poolId_userId: {
                poolId,
                userId: req.user.id,
            },
        },
        include: {
            pool: true,
        },
    }).then((member) => {
        if (!member || member.role !== client_1.PoolRole.OWNER) {
            return next(new errorHandler_1.AppError(403, 'Owner privileges required for this action', 'FORBIDDEN'));
        }
        req.poolMember = member;
        req.pool = member.pool;
        next();
    }).catch(next);
}
//# sourceMappingURL=auth.js.map