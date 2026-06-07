// routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllUsers, deleteUser, getAllStudios,
  getAllBookings, toggleStudioAvailability, getStats,
} = require('../controllers/adminController');
const { isLoggedIn, requireRole } = require('../middleware/auth');

// All admin routes require login + admin role
router.use(isLoggedIn, requireRole('admin'));

router.get('/stats',                    getStats);
router.get('/users',                    getAllUsers);
router.delete('/users/:id',             deleteUser);
router.get('/studios',                  getAllStudios);
router.get('/bookings',                 getAllBookings);
router.patch('/studios/:id/available',  toggleStudioAvailability);

module.exports = router;
