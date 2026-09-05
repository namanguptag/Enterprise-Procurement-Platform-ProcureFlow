const jwt = require('jsonwebtoken');
const db = require('../config/db');
const AppError = require('../utils/appError');

/**
 * Protect middleware ensures the request has a valid JWT token
 * and the user is still active in the system.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header or Query params
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    // 3. Check if user still exists and is active
    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.status, r.name as role
      FROM Users u
      JOIN Roles r ON u.role_id = r.id
      WHERE u.id = ?
    `;
    const [rows] = await db.execute(query, [decoded.id]);
    const currentUser = rows[0];

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.status !== 'active') {
      return next(new AppError('Your account has been deactivated.', 403));
    }

    // 4. Attach user data to req.user for use in downstream middlewares & controllers
    req.user = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      firstName: currentUser.first_name,
      lastName: currentUser.last_name,
      role: currentUser.role
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Restrict access to specific roles.
 * Must be used AFTER protect middleware.
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
