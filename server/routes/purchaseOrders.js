const express = require('express');
const { body } = require('express-validator');
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all purchase order routes
router.use(protect);

const createPOValidationRules = [
  body('purchase_request_id')
    .notEmpty()
    .withMessage('Purchase Request ID is required.')
    .isInt()
    .withMessage('Purchase Request ID must be an integer.'),
  body('vendor_id')
    .notEmpty()
    .withMessage('Vendor ID is required.')
    .isInt()
    .withMessage('Vendor ID must be an integer.'),
  body('expected_delivery_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Expected delivery date must be a valid ISO8601 date (YYYY-MM-DD).')
];

const statusValidationRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['approved', 'ordered', 'delivered', 'cancelled'])
    .withMessage('Status must be approved, ordered, delivered, or cancelled.')
];

// GET /api/purchase-orders - View all purchase orders (Admin, Officer, Manager)
router.get('/', restrictTo('Admin', 'Procurement Officer', 'Manager'), purchaseOrderController.getPurchaseOrders);

// GET /api/purchase-orders/:id - View details of a specific PO (Admin, Officer, Manager)
router.get('/:id', restrictTo('Admin', 'Procurement Officer', 'Manager'), purchaseOrderController.getPurchaseOrderById);

// POST /api/purchase-orders - Generate a PO from an approved request (Procurement Officer, Admin only)
router.post(
  '/',
  restrictTo('Procurement Officer', 'Admin'),
  createPOValidationRules,
  validate,
  purchaseOrderController.createPurchaseOrder
);

// PUT /api/purchase-orders/:id/status - Update PO delivery status (Procurement Officer, Admin only)
router.put(
  '/:id/status',
  restrictTo('Procurement Officer', 'Admin'),
  statusValidationRules,
  validate,
  purchaseOrderController.updatePOStatus
);

module.exports = router;
