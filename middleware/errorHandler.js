const ApiError = require('../utils/ApiError');

/**
 * Converts known error types (Mongoose validation errors, duplicate key
 * errors, cast errors, JWT errors) into consistent ApiError instances.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return ApiError.conflict(`Duplicate value for '${field}': '${value}' already exists`);
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for '${err.path}': ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Authentication token has expired');
  }

  // Fallback: unknown/programming error
  return ApiError.internal(err.message || 'Something went wrong on the server');
};

/**
 * Centralized error-handling middleware. Must be registered last, after
 * all routes, with four arguments so Express recognizes it as an error
 * handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR 💥', err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    details: normalized.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * Catches requests to routes that don't exist.
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
