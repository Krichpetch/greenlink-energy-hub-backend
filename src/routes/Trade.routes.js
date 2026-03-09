const express = require('express');
const router = express.Router();
const { createOffer, getMarket, buyOffer, getMyTrades, cancelOffer } = require('../controllers/Trade.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/offer', verifyToken, createOffer);
router.get('/market', verifyToken, getMarket);
router.post('/:tradeId/buy', verifyToken, buyOffer);
router.get('/my', verifyToken, getMyTrades);
router.delete('/:tradeId', verifyToken, cancelOffer);

module.exports = router;