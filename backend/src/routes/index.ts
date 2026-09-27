import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import userRoutes from '../modules/users/routes';
import poolRoutes from '../modules/pools/routes';
import collaboratorRoutes from '../modules/collaborators/routes';
import invitationRoutes from '../modules/invitations/routes';
import paymentRoutes from '../modules/payments/routes';
import notificationRoutes from '../modules/notifications/routes';
import webhookRoutes from '../modules/webhooks/routes';
import { poolPaymentLinkRouter, publicPayRouter } from '../modules/payment-links/routes';

const router = Router();

// Authentication
router.use('/auth', authRoutes);

// Users
router.use('/users', userRoutes);

// Pools (includes splits, balance, allocations, withdrawals, transactions)
router.use('/pools', poolRoutes);
router.use('/projects', poolRoutes);

// Pool payment-links (authenticated, pool-scoped)
router.use('/pools/:poolId/payment-links', poolPaymentLinkRouter);

// Public payment checkout (unauthenticated)
router.use('/pay', publicPayRouter);

// Collaborators (invitations + members)
router.use('/collaborators', collaboratorRoutes);

// Public invitation flow (view + accept by token)
router.use('/invitations', invitationRoutes);

// Payments: Paystack verification, webhook, callback
router.use('/payments', paymentRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Webhooks
router.use('/webhooks', webhookRoutes);

export default router;
