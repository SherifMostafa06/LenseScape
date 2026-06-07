// routes/studioRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const {
  getAllStudios, getStudio, createStudio,
  updateStudio, deleteStudio, getMyStudios,
} = require('../controllers/studioController');
const { isLoggedIn, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const studioRules = [
  body('name').trim().notEmpty().withMessage('Studio name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('zone').isIn(['maadi', 'zamalek', 'nasr-city', 'new-cairo']).withMessage('Invalid zone'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
];

// Public
router.get('/',    getAllStudios);
router.get('/my',  isLoggedIn, requireRole('owner', 'admin'), getMyStudios);
router.get('/:id', getStudio);

// Owner / Admin only
router.post(
  '/',
  isLoggedIn,
  requireRole('owner', 'admin'),
  upload.array('images', 5),
  studioRules,
  createStudio,
);

router.put(
  '/:id',
  isLoggedIn,
  requireRole('owner', 'admin'),
  upload.array('images', 5),
  studioRules,
  updateStudio,
);

router.delete('/:id', isLoggedIn, requireRole('owner', 'admin'), deleteStudio);

module.exports = router;
