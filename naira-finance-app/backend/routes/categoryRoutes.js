const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const catValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('icon').optional().isLength({ max: 50 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a hex code'),
];

// Income categories
router.get('/income',          ctrl.getIncomeCategories);
router.post('/income',         catValidation, validate, ctrl.createIncomeCategory);
router.delete('/income/:id',   ctrl.deleteIncomeCategory);

// Expense categories
router.get('/expense',         ctrl.getExpenseCategories);
router.post('/expense',        catValidation, validate, ctrl.createExpenseCategory);
router.delete('/expense/:id',  ctrl.deleteExpenseCategory);

module.exports = router;
