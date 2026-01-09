const express = require('express');
const { getNotifications, getUnreadCount, markAllAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/count', getUnreadCount);
router.put('/read', markAllAsRead);

module.exports = router;
