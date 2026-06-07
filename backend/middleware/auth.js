// middleware/auth.js — Session-based auth & role guard
const AppError = require('../utils/AppError');

/** Requires a valid session */
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return next(new AppError('You must be logged in to access this resource.', 401));
};

/** Requires session + specific role(s) */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.session?.userId) {
    return next(new AppError('You must be logged in.', 401));
  }
  if (!roles.includes(req.session.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { isLoggedIn, requireRole };
