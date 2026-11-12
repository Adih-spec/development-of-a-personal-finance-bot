const express = require('express');
const ctrl             = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/monthly',           ctrl.monthlySummary);
router.get('/weekly',            ctrl.weeklySummary);
router.get('/daily',             ctrl.dailySummary);
router.get('/category/expense',  ctrl.categoryReport);
router.get('/category/income',   ctrl.incomeCategoryReport);
router.get('/savings',           ctrl.savingsReport);

module.exports = router;
