const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all product and category routes
router.use(protect);

const productValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product Name is required.')
    .isLength({ max: 100 })
    .withMessage('Product Name cannot exceed 100 characters.'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('Product SKU is required.')
    .isLength({ max: 50 })
    .withMessage('SKU cannot exceed 50 characters.'),
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required.')
    .isInt()
    .withMessage('Category ID must be an integer.'),
  body('vendor_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt()
    .withMessage('Vendor ID must be an integer.'),
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0.00 })
    .withMessage('Price must be a positive decimal number.'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Initial quantity must be a non-negative integer.'),
  body('reorder_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer.')
];

const categoryValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category Name is required.')
    .isLength({ max: 100 })
    .withMessage('Category Name cannot exceed 100 characters.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
];

// Product Routes
router.get('/', restrictTo('Admin', 'Procurement Officer', 'Manager', 'Employee'), productController.getProducts);
router.get('/:id', restrictTo('Admin', 'Procurement Officer', 'Manager', 'Employee'), productController.getProductById);

router.post('/', restrictTo('Admin', 'Procurement Officer'), productValidationRules, validate, productController.createProduct);
router.put('/:id', restrictTo('Admin', 'Procurement Officer'), productValidationRules, validate, productController.updateProduct);
router.delete('/:id', restrictTo('Admin', 'Procurement Officer'), productController.deleteProduct);

// Category Routes
router.get('/categories/all', restrictTo('Admin', 'Procurement Officer', 'Manager', 'Employee'), productController.getCategories);
router.post('/categories/all', restrictTo('Admin', 'Procurement Officer'), categoryValidationRules, validate, productController.createCategory);

module.exports = router;
