// routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['user', 'owner']).withMessage('Role must be user or owner'),
];

const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',   isLoggedIn,    logout);
router.get('/me',        isLoggedIn,    getMe);

module.exports = router;
