const prisma = require('../prisma/client');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Also get unread messages count? 
        // For now, let's keep it simple: Notification model + Unread Messages
        // The prompt says "Aggregated from new messages, reminders..."
        // Reminders create Notifications (as I implemented in reminderController).
        // Messages are separate.

        // Count unread messages
        // Join Conversation -> Messages
        // This is expensive potentially. 
        // Let's just return Notifications from the table for the "Notifications Page"
        // And a separate "unread-count" endpoint for the badge.

        res.json(notifications);
    } catch (error) {
        next(error);
    }
};

// GET /api/notifications/count
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Count unread notifications by type
        // We can do this efficiently with a groupBy or just two queries.
        // Let's do two counts for simplicity and clarity.

        const messageCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
                type: 'MESSAGE'
            }
        });

        const reminderCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
                type: 'REMINDER'
            }
        });

        // Total
        const total = messageCount + reminderCount;

        res.json({
            count: total,
            messageCount,
            reminderCount
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/notifications/read
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, getUnreadCount, markAllAsRead };
