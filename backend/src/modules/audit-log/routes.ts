import { Router } from 'express';
import * as auditLogController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/:entityType/:entityId', auditLogController.getEntityLogs);

export default router;
