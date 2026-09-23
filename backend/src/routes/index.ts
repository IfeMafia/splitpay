import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import userRoutes from '../modules/users/routes';
import poolRoutes from '../modules/pools/routes';
import { poolInvitationRouter, publicInvitationRouter } from '../modules/invitations/routes';
import { poolPaymentLinkRouter, publicPayRouter } from '../modules/payment-links/routes';
import splitRoutes from '../modules/splits/routes';
import transactionRoutes from '../modules/transactions/routes';
import withdrawalRoutes from '../modules/withdrawals/routes';
import notificationRoutes from '../modules/notifications/routes';

const router = Router();

// Authentication
router.use('/auth', authRoutes);

// Users
router.use('/users', userRoutes);

// Root Pools
router.use('/pools', poolRoutes);

// Nested Pool sub-resources
router.use('/pools/:poolId/invitations', poolInvitationRouter);
router.use('/pools/:poolId/payment-links', poolPaymentLinkRouter);
router.use('/pools/:poolId', splitRoutes);
router.use('/pools/:poolId/transactions', transactionRoutes);
router.use('/pools/:poolId/withdrawals', withdrawalRoutes);

// Public Invitations
router.use('/invitations', publicInvitationRouter);

// Public Guest Checkout
router.use('/pay', publicPayRouter);

// In-app Notifications
router.use('/notifications', notificationRoutes);

export default router;
