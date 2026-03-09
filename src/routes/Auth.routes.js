const express = require('express');
const router = express.Router();
const { registerUser, getMe, updateMe } = require('../controllers/Auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/register', verifyToken, registerUser);
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateMe);

module.exports = router;