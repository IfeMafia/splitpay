import { Router } from 'express';
import userRoutes from '../modules/users/routes';
import payoutAccountRoutes from '../modules/payout-accounts/routes';
import projectRoutes from '../modules/projects/routes';
import collaboratorRoutes from '../modules/collaborators/routes';
import paymentRoutes from '../modules/payments/routes';
import payoutRoutes from '../modules/payouts/routes';
import webhookRoutes from '../modules/webhooks/routes';
import auditLogRoutes from '../modules/audit-log/routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/payout-accounts', payoutAccountRoutes);
router.use('/projects', projectRoutes);
router.use('/collaborators', collaboratorRoutes);
router.use('/payments', paymentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
