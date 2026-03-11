const express = require('express');
const router = express.Router();
const { registerUser, getMe, updateMe, getDeviceToken } = require('../controllers/Auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/register', verifyToken, registerUser);
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateMe);

// Device gateway auth — no verifyToken needed, this IS the login
router.post('/device-token', getDeviceToken);

module.exports = router;