const express = require('express');
const { body } = require('express-validator');
const vendorController = require('../controllers/vendorController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware globally to all vendor routes
router.use(protect);

const vendorValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vendor Name is required.')
    .isLength({ max: 100 })
    .withMessage('Vendor Name cannot exceed 100 characters.'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company Name is required.')
    .isLength({ max: 100 })
    .withMessage('Company Name cannot exceed 100 characters.'),
  body('gst_number')
    .trim()
    .notEmpty()
    .withMessage('GST Number is required.')
    .isLength({ min: 15, max: 15 })
    .withMessage('GST Number must be exactly 15 characters long.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Invalid email format.'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters.'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be a decimal between 0 and 5.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive.')
];

// GET /api/vendors - View all vendors (Accessible by Admin, Officer, Manager)
router.get('/', restrictTo('Admin', 'Procurement Officer', 'Manager'), vendorController.getVendors);

// GET /api/vendors/:id - View vendor details (Accessible by Admin, Officer, Manager)
router.get('/:id', restrictTo('Admin', 'Procurement Officer', 'Manager'), vendorController.getVendorById);

// POST /api/vendors - Create vendor (Admin, Procurement Officer only)
router.post(
  '/',
  restrictTo('Admin', 'Procurement Officer'),
  vendorValidationRules,
  validate,
  vendorController.createVendor
);

// PUT /api/vendors/:id - Update vendor (Admin, Procurement Officer only)
router.put(
  '/:id',
  restrictTo('Admin', 'Procurement Officer'),
  vendorValidationRules,
  validate,
  vendorController.updateVendor
);

// DELETE /api/vendors/:id - Delete vendor (Admin, Procurement Officer only)
router.delete('/:id', restrictTo('Admin', 'Procurement Officer'), vendorController.deleteVendor);

module.exports = router;
