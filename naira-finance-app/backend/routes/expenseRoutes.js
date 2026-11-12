const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const expenseValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('transaction_date').isDate().withMessage('Valid date is required'),
  body('description').optional().isLength({ max: 500 }),
  body('payment_method').optional().isIn(['cash','transfer','card','other']),
  body('is_recurring').optional().isBoolean(),
];

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      expenseValidation, validate, ctrl.create);
router.put('/:id',    expenseValidation, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
