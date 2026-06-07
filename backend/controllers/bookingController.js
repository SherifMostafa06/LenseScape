// controllers/bookingController.js
const { validationResult } = require('express-validator');
const Booking    = require('../models/Booking');
const Studio     = require('../models/Studio');
const User       = require('../models/User');
const asyncWrapper = require('../middleware/asyncWrapper');
const AppError   = require('../utils/AppError');
const sendEmail  = require('../utils/sendEmail');

// POST /api/bookings — user creates a booking
const createBooking = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

  const { studioId, date, hours, notes } = req.body;

  const studio = await Studio.findById(studioId);
  if (!studio)          return next(new AppError('Studio not found', 404));
  if (!studio.available) return next(new AppError('This studio is currently unavailable', 400));

  // Prevent booking in the past
  if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
    return next(new AppError('Booking date cannot be in the past', 400));
  }

  const booking = await Booking.create({
    userId:     req.session.userId,
    studioId,
    date:       new Date(date),
    hours:      parseInt(hours),
    totalPrice: studio.price * parseInt(hours),
    notes,
  });

  // Notify studio owner by email (non-fatal — booking succeeds even if email fails)
  try {
    const [user, owner] = await Promise.all([
      User.findById(req.session.userId).select('name email'),
      User.findById(studio.ownerId).select('name email'),
    ]);

    await sendEmail({
      to: owner.email,
      subject: `New Booking Request — ${studio.name}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>${user.name}</strong> has requested to book <strong>${studio.name}</strong>.</p>
        <ul>
          <li><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-GB')}</li>
          <li><strong>Hours:</strong> ${hours}</li>
          <li><strong>Total:</strong> EGP ${studio.price * hours}</li>
          ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
        </ul>
        <p>Log in to your <a href="http://localhost:3000/owner.html">LensSpace dashboard</a> to approve or reject.</p>
      `,
    });
  } catch (emailErr) {
    console.warn('⚠️  Email notification failed (booking still created):', emailErr.message);
  }

  res.status(201).json({ success: true, message: 'Booking request submitted', booking });
});

// GET /api/bookings/my — logged-in user's own bookings
const getMyBookings = asyncWrapper(async (req, res) => {
  const bookings = await Booking.find({ userId: req.session.userId })
    .populate('studioId', 'name zone price images')
    .sort({ createdAt: -1 });
  res.json({ success: true, bookings });
});

// GET /api/bookings/studio/:studioId — owner sees bookings for their studio
const getStudioBookings = asyncWrapper(async (req, res, next) => {
  const studio = await Studio.findById(req.params.studioId);
  if (!studio) return next(new AppError('Studio not found', 404));

  if (studio.ownerId.toString() !== req.session.userId.toString() && req.session.role !== 'admin') {
    return next(new AppError('Access denied', 403));
  }

  const bookings = await Booking.find({ studioId: req.params.studioId })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, bookings });
});

// PATCH /api/bookings/:id/status — owner approves or rejects
const updateBookingStatus = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Status must be approved or rejected', 400));
  }

  const booking = await Booking.findById(req.params.id).populate('studioId').populate('userId', 'name email');
  if (!booking) return next(new AppError('Booking not found', 404));

  // Verify the studio belongs to this owner
  if (
    booking.studioId.ownerId.toString() !== req.session.userId.toString() &&
    req.session.role !== 'admin'
  ) {
    return next(new AppError('Access denied', 403));
  }

  booking.status = status;
  await booking.save();

  // Notify the user by email (non-fatal — status update succeeds even if email fails)
  try {
    await sendEmail({
      to: booking.userId.email,
      subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} — ${booking.studioId.name}`,
      html: `
        <h2>Booking ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Your booking for <strong>${booking.studioId.name}</strong> has been
        <strong>${status}</strong>.</p>
        <ul>
          <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-GB')}</li>
          <li><strong>Hours:</strong> ${booking.hours}</li>
          <li><strong>Total:</strong> EGP ${booking.totalPrice}</li>
        </ul>
        <p><a href="http://localhost:3000/user.html">View your bookings</a></p>
      `,
    });
  } catch (emailErr) {
    console.warn('⚠️  Email notification failed (status still updated):', emailErr.message);
  }

  res.json({ success: true, message: `Booking ${status}`, booking });
});

// GET /api/bookings/owner — all bookings for all of owner's studios
const getOwnerBookings = asyncWrapper(async (req, res) => {
  const studios = await Studio.find({ ownerId: req.session.userId }).select('_id');
  const studioIds = studios.map((s) => s._id);

  const bookings = await Booking.find({ studioId: { $in: studioIds } })
    .populate('studioId', 'name zone')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, bookings });
});

module.exports = { createBooking, getMyBookings, getStudioBookings, updateBookingStatus, getOwnerBookings };
