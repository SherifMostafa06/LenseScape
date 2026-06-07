// routes/bookingRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const {
  createBooking, getMyBookings, getStudioBookings,
  updateBookingStatus, getOwnerBookings,
} = require('../controllers/bookingController');
const { isLoggedIn, requireRole } = require('../middleware/auth');

const bookingRules = [
  body('studioId').notEmpty().withMessage('Studio is required').isMongoId().withMessage('Invalid studio ID'),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
  body('hours').isInt({ min: 1, max: 12 }).withMessage('Hours must be between 1 and 12'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

router.post('/',                 isLoggedIn, requireRole('user'),          bookingRules, createBooking);
router.get('/my',                isLoggedIn, requireRole('user'),          getMyBookings);
router.get('/owner',             isLoggedIn, requireRole('owner', 'admin'), getOwnerBookings);
router.get('/studio/:studioId',  isLoggedIn, requireRole('owner', 'admin'), getStudioBookings);
router.patch('/:id/status',      isLoggedIn, requireRole('owner', 'admin'),
  [body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')],
  updateBookingStatus,
);

module.exports = router;
