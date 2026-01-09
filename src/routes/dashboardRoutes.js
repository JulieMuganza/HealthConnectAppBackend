const express = require('express');
const { getDoctorDashboard, getPatientDashboard } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/doctor', getDoctorDashboard);
router.get('/patient', getPatientDashboard);

module.exports = router;
