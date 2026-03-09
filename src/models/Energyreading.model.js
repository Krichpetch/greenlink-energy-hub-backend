const { db } = require('../config/firebase');

const COLLECTION = 'energyReadings';

const EnergyReadingModel = {
  /**
   * Store a new smart meter reading
   */
  async create(data) {
    const reading = {
      userId: data.userId,
      deviceId: data.deviceId || 'default',
      solarGenerationKw: data.solarGenerationKw || 0,   // Current solar output
      consumptionKw: data.consumptionKw || 0,            // Current home usage
      surplusKw: data.surplusKw || 0,                    // Generation - consumption
      gridImportKw: data.gridImportKw || 0,              // Buying from grid
      gridExportKw: data.gridExportKw || 0,              // Selling to grid
      batteryLevelPct: data.batteryLevelPct || null,     // Battery % if applicable
      voltage: data.voltage || null,
      frequency: data.frequency || null,
      timestamp: data.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(reading);
    return { id: docRef.id, ...reading };
  },

  /**
   * Get latest reading for a user
   */
  async getLatest(userId) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Get readings for a user within a time range
   */
  async getRange(userId, startDate, endDate) {
    const snapshot = await db
      .collection(COLLECTION)
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Get today's total generation and consumption for a user
   */
  async getDailyTotals(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const readings = await this.getRange(
      userId,
      startOfDay.toISOString(),
      new Date().toISOString()
    );

    return readings.reduce(
      (acc, r) => ({
        totalGeneration: acc.totalGeneration + r.solarGenerationKw,
        totalConsumption: acc.totalConsumption + r.consumptionKw,
        totalSurplus: acc.totalSurplus + r.surplusKw,
      }),
      { totalGeneration: 0, totalConsumption: 0, totalSurplus: 0 }
    );
  },
};

module.exports = EnergyReadingModel;