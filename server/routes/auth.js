const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validationMiddleware');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Route: POST /api/auth/login
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required.')
      .isLength({ max: 50 })
      .withMessage('Username cannot exceed 50 characters.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
  ],
  validate,
  authController.login
);

// Route: POST /api/auth/logout
router.post('/logout', authController.logout);

// Route: GET /api/auth/me (Protected check to verify session details)
router.get('/me', protect, authController.getMe);

module.exports = router;
