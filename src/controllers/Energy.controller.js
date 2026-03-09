const EnergyReadingModel = require('../models/Energyreading.model');
const UserModel = require('../models/User.model');

/**
 * POST /api/energy/reading
 * Ingest a new smart meter reading (called by IoT device or simulator)
 */
const submitReading = async (req, res, next) => {
  try {
    const {
      solarGenerationKw,
      consumptionKw,
      batteryLevelPct,
      voltage,
      frequency,
      deviceId,
    } = req.body;

    const surplusKw = Math.max(0, solarGenerationKw - consumptionKw);
    const gridImportKw = Math.max(0, consumptionKw - solarGenerationKw);

    const reading = await EnergyReadingModel.create({
      userId: req.user.uid,
      deviceId,
      solarGenerationKw,
      consumptionKw,
      surplusKw,
      gridImportKw,
      gridExportKw: surplusKw,
      batteryLevelPct,
      voltage,
      frequency,
    });

    res.status(201).json({ reading });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/energy/live
 * Get the latest real-time reading for current user
 */
const getLiveReading = async (req, res, next) => {
  try {
    const reading = await EnergyReadingModel.getLatest(req.user.uid);
    if (!reading) {
      return res.json({ reading: null, message: 'No readings found' });
    }
    res.json({ reading });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/energy/history?start=&end=
 * Get readings within a date range
 */
const getHistory = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }

    const readings = await EnergyReadingModel.getRange(req.user.uid, start, end);
    res.json({ readings, count: readings.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/energy/dashboard
 * Aggregated stats for the Home screen
 */
const getDashboard = async (req, res, next) => {
  try {
    const [latest, dailyTotals, user] = await Promise.all([
      EnergyReadingModel.getLatest(req.user.uid),
      EnergyReadingModel.getDailyTotals(req.user.uid),
      UserModel.getById(req.user.uid),
    ]);

    res.json({
      live: latest,
      today: dailyTotals,
      wallet: {
        balance: user?.walletBalance || 0,
        totalEarnings: user?.totalEarnings || 0,
        totalSavings: user?.totalSavings || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReading, getLiveReading, getHistory, getDashboard };