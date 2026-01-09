const express = require('express');
const { getPatientList, getPatientCase } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/patients', getPatientList);
router.get('/patients/:id/case', getPatientCase);

module.exports = router;
