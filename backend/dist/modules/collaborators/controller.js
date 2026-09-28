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
exports.createCollaborator = createCollaborator;
exports.getProjectCollaborators = getProjectCollaborators;
exports.removeCollaborator = removeCollaborator;
exports.leavePool = leavePool;
const collaboratorService = __importStar(require("./service"));
/**
 * POST /collaborators
 * Body: { projectId, invitedEmail, role, splitPercentage }
 */
async function createCollaborator(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await collaboratorService.createInvitation(userId, req.body);
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
}
/**
 * GET /collaborators/project/:projectId
 */
async function getProjectCollaborators(req, res, next) {
    try {
        const { projectId } = req.params;
        const result = await collaboratorService.getProjectCollaborators(projectId, req.user.id);
        res.status(200).json({ data: result });
    }
    catch (err) {
        next(err);
    }
}
/**
 * DELETE /collaborators/:id
 * Revokes an invitation or removes a pool member.
 */
async function removeCollaborator(req, res, next) {
    try {
        const userId = req.user.id;
        await collaboratorService.removeCollaborator(req.params.id, userId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
/**
 * POST /collaborators/leave/:poolId
 * Allows a collaborator to leave a pool.
 */
async function leavePool(req, res, next) {
    try {
        const userId = req.user.id;
        await collaboratorService.leavePool(req.params.poolId, userId);
        res.status(200).json({ message: 'Successfully left the pool' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map