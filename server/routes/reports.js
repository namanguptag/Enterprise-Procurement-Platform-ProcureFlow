const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all reporting routes
router.use(protect);

// Apply role restrictions: Only Admin, Procurement Officer, and Manager can run exports
router.use(restrictTo('Admin', 'Procurement Officer', 'Manager'));

// GET /api/reports/pdf/purchase-order/:id - Export PO as PDF
router.get('/pdf/purchase-order/:id', reportController.exportPurchaseOrderPdf);

// GET /api/reports/excel/inventory - Export current inventory stock report as Excel (.xlsx)
router.get('/excel/inventory', reportController.exportInventoryExcel);

// GET /api/reports/excel/vendors - Export list of vendors as Excel (.xlsx)
router.get('/excel/vendors', reportController.exportVendorExcel);

module.exports = router;
