"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
exports.getEntityAuditLogs = getEntityAuditLogs;
exports.logFinancialEvent = logFinancialEvent;
exports.getFinancialEvents = getFinancialEvents;
const prisma_1 = require("../../lib/prisma");
async function logAction(dto) {
    const log = await prisma_1.prisma.auditLog.create({
        data: {
            entityType: dto.entityType,
            entityId: dto.entityId,
            action: dto.action,
            actorId: dto.actorId,
            metadata: dto.metadata ?? {},
        },
    });
    return log;
}
async function getEntityAuditLogs(entityType, entityId) {
    return prisma_1.prisma.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
    });
}
async function logFinancialEvent(eventType, entityId, metadata, actorId) {
    return logAction({
        entityType: 'FINANCIAL_EVENT',
        entityId,
        action: eventType,
        actorId,
        metadata,
    });
}
async function getFinancialEvents(entityId) {
    return prisma_1.prisma.auditLog.findMany({
        where: {
            entityType: 'FINANCIAL_EVENT',
            ...(entityId ? { entityId } : {}),
        },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=service.js.map