const { db } = require('../config/firebase');

const COLLECTION = 'trades';

const TradeModel = {
  /**
   * Create a new trade offer (from prosumer)
   */
  async createOffer(data) {
    const offer = {
      sellerId: data.sellerId,
      buyerId: null,
      energyAmountKwh: data.energyAmountKwh,
      pricePerKwh: data.pricePerKwh,
      status: 'open',         // 'open' | 'matched' | 'completed' | 'cancelled'
      tradeType: 'p2p',
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matchedAt: null,
      completedAt: null,
      txHash: null,           // Blockchain transaction hash after settlement
    };

    const docRef = await db.collection(COLLECTION).add(offer);
    return { id: docRef.id, ...offer };
  },

  /**
   * Match a buyer to an open offer
   */
  async matchTrade(tradeId, buyerId) {
    const updateData = {
      buyerId,
      status: 'matched',
      matchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).doc(tradeId).update(updateData);
    return this.getById(tradeId);
  },

  /**
   * Mark trade as completed with blockchain tx hash
   */
  async completeTrade(tradeId, txHash) {
    const updateData = {
      status: 'completed',
      txHash,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).doc(tradeId).update(updateData);
    return this.getById(tradeId);
  },

  async getById(tradeId) {
    const doc = await db.collection(COLLECTION).doc(tradeId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Get all open offers available for buyers
   */
  async getOpenOffers() {
    const snapshot = await db
      .collection(COLLECTION)
      .where('status', '==', 'open')
      .orderBy('pricePerKwh', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Get trade history for a user (as buyer or seller)
   */
  async getUserTrades(userId) {
    const [sellerSnap, buyerSnap] = await Promise.all([
      db.collection(COLLECTION).where('sellerId', '==', userId).orderBy('createdAt', 'desc').get(),
      db.collection(COLLECTION).where('buyerId', '==', userId).orderBy('createdAt', 'desc').get(),
    ]);

    const sellerTrades = sellerSnap.docs.map((d) => ({ id: d.id, ...d.data(), userRole: 'seller' }));
    const buyerTrades = buyerSnap.docs.map((d) => ({ id: d.id, ...d.data(), userRole: 'buyer' }));

    return [...sellerTrades, ...buyerTrades].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  async cancel(tradeId) {
    await db.collection(COLLECTION).doc(tradeId).update({
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  },
};

module.exports = TradeModel;