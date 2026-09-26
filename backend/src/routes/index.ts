import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import userRoutes from '../modules/users/routes';
import poolRoutes from '../modules/pools/routes';
import collaboratorRoutes from '../modules/collaborators/routes';
import invitationRoutes from '../modules/invitations/routes';
import paymentRoutes from '../modules/payments/routes';
import notificationRoutes from '../modules/notifications/routes';
import webhookRoutes from '../modules/webhooks/routes';

const router = Router();

// Authentication
router.use('/auth', authRoutes);

// Users
router.use('/users', userRoutes);

// Pools
router.use('/pools', poolRoutes);
router.use('/projects', poolRoutes);

// Collaborators (invitations + members)
router.use('/collaborators', collaboratorRoutes);

// Public invitation flow (view + accept by token)
router.use('/invitations', invitationRoutes);

// Payments: link generation, Paystack checkout, verification
router.use('/payments', paymentRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Webhooks
router.use('/webhooks', webhookRoutes);

export default router;
