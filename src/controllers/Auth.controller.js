const { auth } = require('../config/firebase');
const UserModel = require('../models/User.model');

/**
 * POST /api/auth/register
 * Called after Firebase client-side registration to create Firestore profile
 */
const registerUser = async (req, res, next) => {
  try {
    const { displayName, role, address, solarCapacityKw } = req.body;
    const { uid, email } = req.user; // from verifyToken middleware

    // Check if user already exists
    const existing = await UserModel.getById(uid);
    if (existing) {
      return res.status(409).json({ error: 'User profile already exists' });
    }

    // Set custom claims for role-based access
    await auth.setCustomUserClaims(uid, { role: role || 'consumer' });

    const user = await UserModel.create(uid, {
      email,
      displayName,
      role,
      address,
      solarCapacityKw,
    });

    res.status(201).json({ message: 'Profile created successfully', user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns current user's Firestore profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.getById(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/me
 * Update current user's profile
 */
const updateMe = async (req, res, next) => {
  try {
    const allowedFields = ['displayName', 'address', 'location', 'solarCapacityKw'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await UserModel.update(req.user.uid, updates);
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, getMe, updateMe };