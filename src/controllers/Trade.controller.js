const TradeModel = require('../models.Trade.model');
const UserModel = require('../models/User.model');

/**
 * POST /api/trades/offer
 * Prosumer creates a sell offer
 */
const createOffer = async (req, res, next) => {
  try {
    const { energyAmountKwh, pricePerKwh, expiresAt } = req.body;

    if (!energyAmountKwh || !pricePerKwh) {
      return res.status(400).json({ error: 'energyAmountKwh and pricePerKwh are required' });
    }

    const trade = await TradeModel.createOffer({
      sellerId: req.user.uid,
      energyAmountKwh,
      pricePerKwh,
      expiresAt,
    });

    res.status(201).json({ message: 'Offer created', trade });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trades/market
 * Get all open offers (for buyers to browse)
 */
const getMarket = async (req, res, next) => {
  try {
    const offers = await TradeModel.getOpenOffers();

    // Enrich with seller display name
    const enriched = await Promise.all(
      offers.map(async (offer) => {
        const seller = await UserModel.getById(offer.sellerId);
        return {
          ...offer,
          sellerName: seller?.displayName || 'Anonymous',
          sellerAddress: seller?.address || '',
        };
      })
    );

    res.json({ offers: enriched, count: enriched.length });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trades/:tradeId/buy
 * Consumer buys an open offer
 */
const buyOffer = async (req, res, next) => {
  try {
    const { tradeId } = req.params;

    const trade = await TradeModel.getById(tradeId);
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Trade is no longer available' });
    if (trade.sellerId === req.user.uid) return res.status(400).json({ error: 'Cannot buy your own offer' });

    const matched = await TradeModel.matchTrade(tradeId, req.user.uid);

    // TODO: Trigger blockchain settlement via AWS
    // For now, auto-complete with a mock tx hash
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const completed = await TradeModel.completeTrade(tradeId, mockTxHash);

    // Update wallet balances
    const totalCost = trade.energyAmountKwh * trade.pricePerKwh;
    await Promise.all([
      UserModel.update(trade.sellerId, {
        walletBalance: (await UserModel.getById(trade.sellerId)).walletBalance + totalCost,
        totalEarnings: (await UserModel.getById(trade.sellerId)).totalEarnings + totalCost,
      }),
      UserModel.update(req.user.uid, {
        totalSavings: (await UserModel.getById(req.user.uid)).totalSavings + totalCost * 0.1,
      }),
    ]);

    res.json({ message: 'Trade completed', trade: completed });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trades/my
 * Get current user's trade history
 */
const getMyTrades = async (req, res, next) => {
  try {
    const trades = await TradeModel.getUserTrades(req.user.uid);
    res.json({ trades, count: trades.length });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trades/:tradeId
 * Cancel own open offer
 */
const cancelOffer = async (req, res, next) => {
  try {
    const { tradeId } = req.params;
    const trade = await TradeModel.getById(tradeId);

    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.sellerId !== req.user.uid) return res.status(403).json({ error: 'Not your offer' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Can only cancel open offers' });

    await TradeModel.cancel(tradeId);
    res.json({ message: 'Offer cancelled' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOffer, getMarket, buyOffer, getMyTrades, cancelOffer };