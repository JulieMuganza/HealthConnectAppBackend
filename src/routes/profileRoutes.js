const express = require('express');
const {
    getDoctorProfile,
    updateDoctorProfile,
    getPatientProfile,
    updatePatientProfile,
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/doctor', getDoctorProfile);
router.put('/doctor', updateDoctorProfile);
router.get('/patient', getPatientProfile);
router.put('/patient', updatePatientProfile);

module.exports = router;
