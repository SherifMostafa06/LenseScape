// controllers/authController.js
const { validationResult } = require('express-validator');
const User      = require('../models/User');
const asyncWrapper = require('../middleware/asyncWrapper');
const AppError  = require('../utils/AppError');

// POST /api/auth/register
const register = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { name, email, password, role } = req.body;

  // Prevent self-promotion to admin
  const safeRole = role === 'admin' ? 'user' : (role || 'user');

  const user = await User.create({ name, email, password, role: safeRole });

  // Start session immediately after registration
  req.session.userId = user._id;
  req.session.role   = user.role;
  req.session.name   = user.name;

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
const login = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  const { email, password } = req.body;

  // Explicitly select password (it's select:false in schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  req.session.userId = user._id;
  req.session.role   = user.role;
  req.session.name   = user.name;

  res.json({
    success: true,
    message: 'Logged in successfully',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

// GET /api/auth/me
const getMe = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.session.userId);
  if (!user) return next(new AppError('User not found', 404));
  res.json({ success: true, user });
});

module.exports = { register, login, logout, getMe };
