"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getUserProjects = getUserProjects;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;
exports.getProjectBalanceSummary = getProjectBalanceSummary;
exports.getProjectAllocations = getProjectAllocations;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
async function createProject(ownerId, dto) {
    const project = await prisma_1.prisma.project.create({
        data: {
            ownerId,
            name: dto.name,
            description: dto.description,
            totalAmount: dto.totalAmount,
            currency: dto.currency,
        },
    });
    return project;
}
async function getUserProjects(ownerId) {
    return prisma_1.prisma.project.findMany({ where: { ownerId } });
}
async function getProjectById(ownerId, projectId) {
    const project = await prisma_1.prisma.project.findFirst({
        where: { id: projectId, ownerId },
    });
    if (!project)
        throw new errorHandler_1.AppError(404, 'Project not found', 'NOT_FOUND');
    return project;
}
/**
 * TODO: Validate that total split percentage across collaborators doesn't exceed 100% when activating project.
 * TODO: Prevent modifying totalAmount or status if payments are already associated.
 */
async function updateProject(ownerId, projectId, dto) {
    await getProjectById(ownerId, projectId);
    const updated = await prisma_1.prisma.project.update({
        where: { id: projectId },
        data: dto,
    });
    return updated;
}
async function getProjectBalanceSummary(projectId) {
    const account = await prisma_1.prisma.projectAccount.findUnique({
        where: { projectId },
    });
    const payouts = await prisma_1.prisma.payoutTransaction.findMany({
        where: { payment: { projectId } },
        include: { collaborator: true },
    });
    const memberBalances = {};
    for (const payout of payouts) {
        const cid = payout.collaboratorId;
        if (!memberBalances[cid]) {
            memberBalances[cid] = {
                role: payout.collaborator.role,
                allocated: 0,
                withdrawn: 0,
                available: 0,
            };
        }
        const amt = Number(payout.amount);
        memberBalances[cid].allocated += amt;
        if (payout.status === 'SUCCESSFUL') {
            memberBalances[cid].withdrawn += amt;
        }
        memberBalances[cid].available = memberBalances[cid].allocated - memberBalances[cid].withdrawn;
    }
    return {
        projectId,
        totalReceived: account ? Number(account.totalReceived) : 0,
        totalDisbursed: account ? Number(account.totalDisbursed) : 0,
        currentBalance: account ? Number(account.currentBalance) : 0,
        currency: account?.currency || 'USD',
        collaboratorBreakdown: memberBalances,
    };
}
async function getProjectAllocations(projectId) {
    return prisma_1.prisma.splitSnapshot.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=service.js.map