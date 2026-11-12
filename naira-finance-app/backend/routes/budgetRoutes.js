const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const budgetValidation = [
  body('category_id').isInt({ min: 1 }),
  body('amount_limit').isFloat({ min: 1 }).withMessage('Budget limit must be greater than 0'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }),
  body('alert_75').optional().isBoolean(),
  body('alert_90').optional().isBoolean(),
  body('alert_100').optional().isBoolean(),
];

router.get('/',       ctrl.getAll);
router.get('/alerts', ctrl.getAlerts);
router.post('/',      budgetValidation, validate, ctrl.create);
router.put('/:id',    [
  body('amount_limit').isFloat({ min: 1 }),
  body('alert_75').optional().isBoolean(),
  body('alert_90').optional().isBoolean(),
  body('alert_100').optional().isBoolean(),
], validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
