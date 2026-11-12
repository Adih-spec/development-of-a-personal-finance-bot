const express = require('express');
const { body, query } = require('express-validator');
const ctrl             = require('../controllers/incomeController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const incomeValidation = [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('transaction_date').isDate().withMessage('Valid date is required'),
  body('description').optional().isLength({ max: 500 }),
  body('source').optional().isLength({ max: 150 }),
  body('is_recurring').optional().isBoolean(),
];

router.get('/',      ctrl.getAll);
router.get('/:id',   ctrl.getOne);
router.post('/',     incomeValidation, validate, ctrl.create);
router.put('/:id',   incomeValidation, validate, ctrl.update);
router.delete('/:id',ctrl.remove);

module.exports = router;
