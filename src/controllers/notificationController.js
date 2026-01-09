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

        // Count unread notifications
        const unreadNotes = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        // Count unread messages (where sender != user AND isRead = false)
        // We look at all messages in conversations where user is a participant?
        // Actually, schema has Message.isRead.
        // We find messages where recipient is the user. But Message table only has senderId.
        // So we need to find messages in conversations user is part of, where sender != user, and isRead = false.

        const conversations = await prisma.conversationParticipant.findMany({
            where: { userId },
            select: { conversationId: true }
        });

        const convIds = conversations.map(c => c.conversationId);

        const unreadMessages = await prisma.message.count({
            where: {
                conversationId: { in: convIds },
                senderId: { not: userId },
                isRead: false
            }
        });

        res.json({ count: unreadNotes + unreadMessages });
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
