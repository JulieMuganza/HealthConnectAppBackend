const express = require('express');
const { updateAppointmentStatus } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
