import { Response, NextFunction } from 'express';
import * as auditLogService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getEntityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const logs = await auditLogService.getEntityAuditLogs(entityType, entityId);
    res.status(200).json({ data: logs });
  } catch (err) {
    next(err);
  }
}
