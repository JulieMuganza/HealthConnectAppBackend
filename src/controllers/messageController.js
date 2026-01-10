const prisma = require('../prisma/client');

// GET /api/conversations
// GET /api/conversations
const getConversations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // DOCTOR or PATIENT

        // 1. Determine target users (The people we want to chat with)
        const targetRole = userRole === 'DOCTOR' ? 'PATIENT' : 'DOCTOR';
        const targetUsers = await prisma.user.findMany({
            where: { role: targetRole },
        });

        // 2. Ensure conversations exist for each target user
        // This is a simplified approach for the MVP to guarantee the UI has "slots" for everyone
        for (const target of targetUsers) {
            // Check if conversation exists
            const existing = await prisma.conversation.findFirst({
                where: {
                    participants: {
                        every: {
                            userId: { in: [userId, target.id] }
                        }
                    }
                }
            });

            // Note: The logic above 'every' with 'in' is slightly loose, strictly should count participants = 2
            // Better: AND logic.
            // But let's verify correctly:
            const exactMatch = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { userId: userId } } },
                        { participants: { some: { userId: target.id } } }
                    ]
                }
            });

            if (!exactMatch) {
                await prisma.conversation.create({
                    data: {
                        participants: {
                            create: [
                                { userId: userId },
                                { userId: target.id }
                            ]
                        }
                    }
                });
            }
        }

        // 3. Fetch all conversations now that we ensured they exist
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    include: { user: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const formatted = await Promise.all(conversations.map(async (conv) => {
            const otherParticipant = conv.participants.find((p) => p.userId !== userId);
            const lastMsg = conv.messages[0];

            if (!otherParticipant) return null;

            // Count unread messages sent by the OTHER person
            const unread = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: otherParticipant.userId,
                    isRead: false
                }
            });

            return {
                id: conv.id,
                participant: {
                    id: otherParticipant.user.id,
                    name: otherParticipant.user.name,
                    role: otherParticipant.user.role,
                    avatar: otherParticipant.user.avatarUrl,
                },
                lastMessage: lastMsg?.text || 'Start a conversation',
                time: lastMsg ? lastMsg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                unreadCount: unread,
            };
        }));

        res.json(formatted.filter(Boolean));
    } catch (error) {
        next(error);
    }
};

// GET /api/conversations/:id/messages
const getMessages = async (req, res, next) => {
    try {
        const conversationId = parseInt(req.params.id);
        const userId = req.user.id;

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                isRead: false,
                senderId: { not: userId } // Only mark incoming messages
            },
            data: { isRead: true }
        });

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
        });

        const formatted = messages.map((msg) => ({
            id: msg.id,
            senderId: msg.senderId,
            text: msg.text,
            time: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: msg.isRead,
        }));

        res.json(formatted);
    } catch (error) {
        next(error);
    }
};

// POST /api/conversations/:id/messages
const sendMessage = async (req, res, next) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { text } = req.body;
        const senderId = req.user.id;

        // Verify participation
        const participation = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId, userId: senderId },
            },
        });

        if (!participation) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                text,
            },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // 3. Create Notification for the Recipient
        // We need to find the OTHER participant in the conversation
        const participants = await prisma.conversationParticipant.findMany({
            where: { conversationId }
        });

        const recipient = participants.find(p => p.userId !== senderId);

        if (recipient) {
            await prisma.notification.create({
                data: {
                    userId: recipient.userId,
                    type: 'MESSAGE',
                    message: `New message from ${req.user.name || 'User'}`,
                    isRead: false
                }
            });
        }

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};

module.exports = { getConversations, getMessages, sendMessage };
