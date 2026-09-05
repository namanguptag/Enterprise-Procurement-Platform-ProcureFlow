const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all inventory routes
router.use(protect);

const adjustmentValidationRules = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required.')
    .isInt()
    .withMessage('Product ID must be an integer.'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt()
    .withMessage('Quantity must be an integer.')
    .custom((value) => {
      if (parseInt(value, 10) === 0) {
        throw new Error('Quantity adjustment cannot be zero.');
      }
      return true;
    }),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes cannot exceed 255 characters.')
];

// GET /api/inventory - General inventory overview (Admin, Officer, Manager)
router.get('/', restrictTo('Admin', 'Procurement Officer', 'Manager'), inventoryController.getInventory);

// GET /api/inventory/alerts - List products that need reordering (Admin, Officer, Manager)
router.get('/alerts', restrictTo('Admin', 'Procurement Officer', 'Manager'), inventoryController.getLowStockAlerts);

// GET /api/inventory/history - Audit trail of inventory transactions (Admin, Officer, Manager)
router.get('/history', restrictTo('Admin', 'Procurement Officer', 'Manager'), inventoryController.getInventoryHistory);
router.get('/history/:productId', restrictTo('Admin', 'Procurement Officer', 'Manager'), inventoryController.getInventoryHistory);

// PUT /api/inventory/adjust - Manually adjust stock levels (Admin, Procurement Officer only)
router.put(
  '/adjust',
  restrictTo('Admin', 'Procurement Officer'),
  adjustmentValidationRules,
  validate,
  inventoryController.adjustStock
);

module.exports = router;
