import { prisma } from '../../lib/prisma';
import { CreateAuditLogDto, AuditLogResponse } from './types';

export async function logAction(dto: CreateAuditLogDto): Promise<AuditLogResponse> {
  const log = await prisma.auditLog.create({
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

export async function getEntityAuditLogs(entityType: string, entityId: string): Promise<AuditLogResponse[]> {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
  });
}
