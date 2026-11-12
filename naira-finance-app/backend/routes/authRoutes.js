const express = require('express');
const { body }        = require('express-validator');
const ctrl            = require('../controllers/authController');
const { authenticate }= require('../middleware/auth');
const { validate }    = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 150 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
], validate, ctrl.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], validate, ctrl.login);

// GET /api/auth/profile  (protected)
router.get('/profile', authenticate, ctrl.getProfile);

// PUT /api/auth/profile  (protected)
router.put('/profile', authenticate, [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('phone').optional().isMobilePhone(),
], validate, ctrl.updateProfile);

// PUT /api/auth/change-password  (protected)
router.put('/change-password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[0-9]/).withMessage('Must contain a number'),
], validate, ctrl.changePassword);

// POST /api/auth/logout  (protected)
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
