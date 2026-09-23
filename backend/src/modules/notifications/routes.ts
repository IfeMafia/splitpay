import { Router } from 'express';
import * as notificationController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/:notificationId/read', authenticate, notificationController.markAsRead);

export default router;
