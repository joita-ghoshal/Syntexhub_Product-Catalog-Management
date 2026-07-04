const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');

/**
 * Protects routes by requiring a valid JWT in the Authorization header:
 *   Authorization: Bearer <token>
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('No authentication token provided. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
  }

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists.');
  }

  req.user = currentUser;
  next();
});

/**
 * Restricts access to specific roles.
 * Usage: restrictTo('admin')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, restrictTo };
