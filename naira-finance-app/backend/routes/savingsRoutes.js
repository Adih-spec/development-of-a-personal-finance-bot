const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/savingsController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// Goals
router.get('/',              ctrl.getGoals);
router.get('/:id',           ctrl.getGoal);
router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('target_amount').isFloat({ min: 1 }),
  body('target_date').optional().isDate(),
  body('description').optional().isLength({ max: 500 }),
], validate, ctrl.createGoal);
router.put('/:id', [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('target_amount').isFloat({ min: 1 }),
  body('status').optional().isIn(['active','completed','paused','cancelled']),
], validate, ctrl.updateGoal);
router.delete('/:id', ctrl.deleteGoal);

// Contributions
router.get('/:id/contributions', ctrl.getContributions);
router.post('/:id/contributions', [
  body('amount').isFloat({ min: 0.01 }),
  body('type').isIn(['deposit','withdrawal']),
  body('contribution_date').isDate(),
  body('note').optional().isLength({ max: 500 }),
], validate, ctrl.addContribution);

module.exports = router;
