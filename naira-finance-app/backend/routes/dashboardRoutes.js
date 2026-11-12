const express = require('express');
const ctrl             = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/summary', ctrl.getSummary);

module.exports = router;
