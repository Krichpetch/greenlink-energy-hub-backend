const { db } = require('../config/firebase');

const COLLECTION = 'users';

const UserModel = {
  /**
   * Create a new user profile in Firestore after Firebase Auth registration
   */
  async create(uid, data) {
    const userDoc = {
      uid,
      email: data.email,
      displayName: data.displayName || '',
      role: data.role || 'consumer', // 'prosumer' | 'consumer' | 'admin'
      address: data.address || '',
      location: data.location || null, // { lat, lng }
      walletBalance: 0,
      totalEarnings: 0,
      totalSavings: 0,
      solarCapacityKw: data.solarCapacityKw || 0,
      hasSolarPanel: data.role === 'prosumer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTION).doc(uid).set(userDoc);
    return userDoc;
  },

  async getById(uid) {
    const doc = await db.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async update(uid, data) {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    await db.collection(COLLECTION).doc(uid).update(updateData);
    return this.getById(uid);
  },

  async getAll() {
    const snapshot = await db.collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};

module.exports = UserModel;