const { NotFoundError } = require('../utils/errors');

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
}

module.exports = notFoundHandler;
