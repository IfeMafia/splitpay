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
exports.createPool = createPool;
exports.getPools = getPools;
exports.getPool = getPool;
exports.updatePool = updatePool;
exports.deletePool = deletePool;
exports.getMembers = getMembers;
exports.addMember = addMember;
exports.removeMember = removeMember;
const poolService = __importStar(require("./service"));
async function createPool(req, res, next) {
    try {
        const pool = await poolService.createPool(req.user.id, req.body);
        res.status(201).json({
            data: pool,
            message: 'Pool created successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function getPools(req, res, next) {
    try {
        const pools = await poolService.getUserPools(req.user.id);
        res.status(200).json({ data: pools });
    }
    catch (err) {
        next(err);
    }
}
async function getPool(req, res, next) {
    try {
        const pool = await poolService.getPoolById(req.params.poolId);
        res.status(200).json({ data: pool });
    }
    catch (err) {
        next(err);
    }
}
async function updatePool(req, res, next) {
    try {
        const pool = await poolService.updatePool(req.params.poolId, req.user.id, req.body);
        res.status(200).json({
            data: pool,
            message: 'Pool updated successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function deletePool(req, res, next) {
    try {
        await poolService.deletePool(req.params.poolId, req.user.id);
        res.status(200).json({
            message: 'Pool archived successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function getMembers(req, res, next) {
    try {
        const members = await poolService.getPoolMembers(req.params.poolId);
        res.status(200).json({ data: members });
    }
    catch (err) {
        next(err);
    }
}
async function addMember(req, res, next) {
    try {
        const member = await poolService.addPoolMember(req.params.poolId, req.user.id, req.body);
        res.status(201).json({
            data: member,
            message: 'Member added successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function removeMember(req, res, next) {
    try {
        await poolService.removePoolMember(req.params.poolId, req.params.memberId, req.user.id);
        res.status(200).json({
            message: 'Member removed successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map