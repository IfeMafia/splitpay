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

export type FinancialEventType =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'ALLOCATION_CREATED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_SUCCESS'
  | 'WITHDRAWAL_FAILED';

export async function logFinancialEvent(
  eventType: FinancialEventType,
  entityId: string,
  metadata?: Record<string, any>,
  actorId?: string
): Promise<AuditLogResponse> {
  return logAction({
    entityType: 'FINANCIAL_EVENT',
    entityId,
    action: eventType,
    actorId,
    metadata,
  });
}

export async function getFinancialEvents(entityId?: string): Promise<AuditLogResponse[]> {
  return prisma.auditLog.findMany({
    where: {
      entityType: 'FINANCIAL_EVENT',
      ...(entityId ? { entityId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

