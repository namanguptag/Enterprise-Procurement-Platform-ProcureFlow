const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle MySQL validation or unique constraint errors gracefully
  if (err.code === 'ER_DUP_ENTRY') {
    err = new AppError('Resource already exists with this unique identifier.', 400);
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    err = new AppError('Related resource does not exist.', 400);
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    err = new AppError('Cannot delete this resource because it is referenced by other records.', 400);
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // Production Mode: Hide detailed error trace for non-operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Log unhandled programming/infrastructure errors
  console.error('ERROR 💥:', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
};

module.exports = errorHandler;
