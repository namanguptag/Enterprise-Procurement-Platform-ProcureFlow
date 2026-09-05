const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all analytics routes
router.use(protect);

// Allow only Admin, Procurement Officer, and Manager roles to view dashboard reports
router.use(restrictTo('Admin', 'Procurement Officer', 'Manager'));

// GET /api/analytics - Fetch overall dashboard analytics summaries
router.get('/', analyticsController.getDashboardSummary);

module.exports = router;
