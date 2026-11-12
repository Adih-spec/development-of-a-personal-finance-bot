const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/ajoController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

const ajoValidation = [
  body('type').isIn(['ajo','esusu']).withMessage('Type must be ajo or esusu'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('contribution_date').isDate(),
  body('group_name').optional().isLength({ max: 200 }),
  body('description').optional().isLength({ max: 500 }),
  body('cycle').optional().isIn(['daily','weekly','monthly']),
  body('status').optional().isIn(['paid','pending','received']),
];

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getOne);
router.post('/',      ajoValidation, validate, ctrl.create);
router.put('/:id',    ajoValidation, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
