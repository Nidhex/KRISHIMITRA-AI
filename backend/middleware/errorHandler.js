/* ==========================================================================
   KrishiMitra AI — Global Error Handler Middleware
   ========================================================================== */

'use strict';

const { logger } = require('./logger');

/**
 * Express global error handler.
 * Must have 4 parameters for Express to treat it as an error handler.
 *
 * @param {Error}   err
 * @param {Object}  req
 * @param {Object}  res
 * @param {Function} next
 */
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Internal Server Error';
  // Strip API keys / secrets
  let sanitized = msg.replace(/(key=|api_key=|bearer\s+)[a-zA-Z0-9_\-]+/gi, '$1[REDACTED]');
  // Strip internal server file paths
  sanitized = sanitized.replace(/([A-Z]:\\[^:\n\r\t]+|\/(?:home|Users|var|usr|etc)\/[^\s:]+)/gi, '[REDACTED_PATH]');
  return sanitized;
}

function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const safeMessage = sanitizeErrorMessage(err.message);

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
    message:    safeMessage,
    stack:      process.env.NODE_ENV === 'development' ? err.stack : undefined,
    status
  });

  res.status(status).json({
    success: false,
    error:   safeMessage,
    code:    err.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler };
