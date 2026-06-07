// controllers/adminController.js
const User     = require('../models/User');
const Studio   = require('../models/Studio');
const Booking  = require('../models/Booking');
const asyncWrapper = require('../middleware/asyncWrapper');
const AppError = require('../utils/AppError');

// GET /api/admin/users — paginated user list
const getAllUsers = asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncWrapper(async (req, res, next) => {
  if (req.params.id === req.session.userId.toString()) {
    return next(new AppError('You cannot delete your own admin account', 400));
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/studios — all studios (admin view, paginated)
const getAllStudios = asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const [studios, total] = await Promise.all([
    Studio.find().populate('ownerId', 'name email').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Studio.countDocuments(),
  ]);

  res.json({ success: true, studios, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/admin/bookings — all bookings
const getAllBookings = asyncWrapper(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find()
      .populate('userId',   'name email')
      .populate('studioId', 'name zone')
      .skip(skip).limit(limit).sort({ createdAt: -1 }),
    Booking.countDocuments(),
  ]);

  res.json({ success: true, bookings, total, page, pages: Math.ceil(total / limit) });
});

// PATCH /api/admin/studios/:id/available — toggle availability
const toggleStudioAvailability = asyncWrapper(async (req, res, next) => {
  const studio = await Studio.findById(req.params.id);
  if (!studio) return next(new AppError('Studio not found', 404));
  studio.available = !studio.available;
  await studio.save();
  res.json({ success: true, message: `Studio is now ${studio.available ? 'available' : 'unavailable'}`, studio });
});

// GET /api/admin/stats — dashboard summary
const getStats = asyncWrapper(async (req, res) => {
  const [totalUsers, totalStudios, totalBookings, pendingBookings] = await Promise.all([
    User.countDocuments(),
    Studio.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
  ]);

  res.json({
    success: true,
    stats: { totalUsers, totalStudios, totalBookings, pendingBookings },
  });
});

module.exports = { getAllUsers, deleteUser, getAllStudios, getAllBookings, toggleStudioAvailability, getStats };
