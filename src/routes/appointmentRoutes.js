const express = require('express');
const { updateAppointmentStatus } = require('../controllers/dashboardController');
const { createAppointment, getAppointments } = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
