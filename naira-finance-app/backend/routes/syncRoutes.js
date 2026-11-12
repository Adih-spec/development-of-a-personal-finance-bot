const express = require('express');
const { body }         = require('express-validator');
const ctrl             = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.post('/', [
  body('transactions').isArray().withMessage('transactions must be an array'),
  body('transactions.*.local_id').notEmpty(),
  body('transactions.*.entity_type').isIn(['income','expense','savings_contribution','ajo_esusu']),
  body('transactions.*.data').isObject(),
], validate, ctrl.syncData);

router.get('/status', ctrl.getSyncStatus);

module.exports = router;
