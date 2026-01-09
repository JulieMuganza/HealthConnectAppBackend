const express = require('express');
const { getReminders, createReminder } = require('../controllers/reminderController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getReminders);
router.post('/', createReminder);

module.exports = router;
