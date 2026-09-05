const express = require('express');
const { body } = require('express-validator');
const purchaseRequestController = require('../controllers/purchaseRequestController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all purchase request routes
router.use(protect);

const requestValidationRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Request Title is required.')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters.'),
  body('justification')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Purchase request must contain an array of at least 1 item.'),
  body('items.*.product_id')
    .notEmpty()
    .withMessage('Product ID is required for each item.')
    .isInt()
    .withMessage('Product ID must be an integer.'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer greater than or equal to 1.')
];

const reviewValidationRules = [
  body('status')
    .notEmpty()
    .withMessage('Review status is required.')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected.'),
  body('comments')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
];

// GET /api/purchase-requests - View requests (Employee gets personal, others get all)
router.get('/', restrictTo('Admin', 'Procurement Officer', 'Manager', 'Employee'), purchaseRequestController.getPurchaseRequests);

// GET /api/purchase-requests/:id - View details (Scopes verified in controller)
router.get('/:id', restrictTo('Admin', 'Procurement Officer', 'Manager', 'Employee'), purchaseRequestController.getPurchaseRequestById);

// POST /api/purchase-requests - Submit request (Employee or Admin)
router.post(
  '/',
  restrictTo('Employee', 'Admin'),
  requestValidationRules,
  validate,
  purchaseRequestController.createPurchaseRequest
);

// POST /api/purchase-requests/:id/review - Manager review approvals (Manager or Admin)
router.post(
  '/:id/review',
  restrictTo('Manager', 'Admin'),
  reviewValidationRules,
  validate,
  purchaseRequestController.reviewPurchaseRequest
);

module.exports = router;
