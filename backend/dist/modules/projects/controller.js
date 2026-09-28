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
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProject = getProject;
exports.updateProject = updateProject;
exports.getProjectBalance = getProjectBalance;
exports.getProjectAllocations = getProjectAllocations;
const projectService = __importStar(require("./service"));
async function createProject(req, res, next) {
    try {
        const project = await projectService.createProject(req.user.id, req.body);
        res.status(201).json({ data: project });
    }
    catch (err) {
        next(err);
    }
}
async function getProjects(req, res, next) {
    try {
        const projects = await projectService.getUserProjects(req.user.id);
        res.status(200).json({ data: projects });
    }
    catch (err) {
        next(err);
    }
}
async function getProject(req, res, next) {
    try {
        const project = await projectService.getProjectById(req.user.id, req.params.id);
        res.status(200).json({ data: project });
    }
    catch (err) {
        next(err);
    }
}
async function updateProject(req, res, next) {
    try {
        const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
        res.status(200).json({ data: project });
    }
    catch (err) {
        next(err);
    }
}
async function getProjectBalance(req, res, next) {
    try {
        const summary = await projectService.getProjectBalanceSummary(req.params.id);
        res.status(200).json({ data: summary });
    }
    catch (err) {
        next(err);
    }
}
async function getProjectAllocations(req, res, next) {
    try {
        const allocations = await projectService.getProjectAllocations(req.params.id);
        res.status(200).json({ data: allocations });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map