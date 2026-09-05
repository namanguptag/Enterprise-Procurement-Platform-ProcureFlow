const { validationResult } = require('express-validator');

/**
 * Middleware that parses express-validator results.
 * If validation fails, it short-circuits the request and returns a structured 400 response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg
  }));

  return res.status(400).json({
    success: false,
    message: 'Input validation failed.',
    errors: formattedErrors
  });
};

module.exports = {
  validate
};
