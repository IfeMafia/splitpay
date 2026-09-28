import { Response, NextFunction } from 'express';
import * as notificationService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await notificationService.getUserNotifications(req.user!.id);
    res.status(200).json({ data: notifications });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markNotificationAsRead(req.user!.id, req.params.notificationId as string);
    res.status(200).json({
      message: 'Notification marked as read',
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.markAllNotificationsAsRead(req.user!.id);
    res.status(200).json({
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
}
