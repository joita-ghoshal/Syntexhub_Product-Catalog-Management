const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after express-validator's chain of checks and forwards a
 * formatted 400 error if any validation rule failed.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(ApiError.badRequest('Validation failed', messages));
  }
  next();
};

module.exports = validateRequest;
