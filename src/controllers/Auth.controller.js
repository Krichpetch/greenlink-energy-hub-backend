const { auth } = require('../config/firebase');
const UserModel = require('../models/User.model');

/**
 * POST /api/auth/register
 */
const registerUser = async (req, res, next) => {
  try {
    const { displayName, role, address, solarCapacityKw } = req.body;
    const { uid, email } = req.user;

    const existing = await UserModel.getById(uid);
    if (existing) {
      return res.status(200).json({ message: 'Profile already exists', user: existing });
    }

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
 * Auto-creates profile if missing (handles case where Firestore was down during registration)
 */
const getMe = async (req, res, next) => {
  try {
    let user = await UserModel.getById(req.user.uid);

    if (!user) {
      user = await UserModel.create(req.user.uid, {
        email: req.user.email || '',
        displayName: req.user.name || req.user.email?.split('@')[0] || 'User',
        role: req.user.role || 'consumer',
        address: '',
        solarCapacityKw: 0,
      });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/me
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