"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const prisma_1 = require("../../lib/prisma");
async function getUserNotifications(userId) {
    const notifications = await prisma_1.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    return notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        data: n.data,
        createdAt: n.createdAt,
    }));
}
async function markNotificationAsRead(userId, notificationId) {
    await prisma_1.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
    });
}
async function markAllNotificationsAsRead(userId) {
    await prisma_1.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
}
//# sourceMappingURL=service.js.map