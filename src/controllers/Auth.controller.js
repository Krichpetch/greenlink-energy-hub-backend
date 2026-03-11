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

/**
 * POST /api/auth/device-token
 * Used by IoT gateway (WISE-6610) to get a Firebase ID token for API auth
 * No verifyToken middleware — this is the login itself
 */
const getDeviceToken = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({ error: data.error.message });
    }

    res.json({
      idToken: data.idToken,
      expiresIn: data.expiresIn, // 3600 seconds
      userId: data.localId,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, getMe, updateMe, getDeviceToken };