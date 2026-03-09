const express = require('express');
const router = express.Router();
const { submitReading, getLiveReading, getHistory, getDashboard } = require('../controllers/Energy.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/reading', verifyToken, submitReading);
router.get('/live', verifyToken, getLiveReading);
router.get('/history', verifyToken, getHistory);
router.get('/dashboard', verifyToken, getDashboard);

module.exports = router;