const { AppError } = require('../utils/errors');

/**
 * Centralized error handler middleware
 */
function errorHandler(err, req, res, next) {
  // If headers sent already, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'An unexpected internal server error occurred';
  let code = 'INTERNAL_SERVER_ERROR';
  let details = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}'`;
    code = 'BAD_REQUEST';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload in request body';
    code = 'BAD_REQUEST';
  } else if (err.message) {
    message = err.message;
  }

  const errorPayload = {
    message,
    code,
  };

  if (details) {
    errorPayload.details = details;
  }

  // Log non-operational error details for server diagnostics
  if (statusCode >= 500) {
    console.error('[SERVER ERROR]', err);
  }

  return res.status(statusCode).json({ error: errorPayload });
}

module.exports = errorHandler;
