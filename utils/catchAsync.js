/**
 * Wraps an async route/controller function and forwards any rejected
 * promise to Express's next() so the centralized error handler can
 * process it. This avoids repetitive try/catch blocks in controllers.
 *
 * @param {Function} fn - async (req, res, next) => {}
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
