/* ==========================================================================
   KrishiMitra AI — Rate Limiter Middleware
   Prevents API abuse while allowing normal farmer usage.
   ========================================================================== */

'use strict';

const hits = new Map();

/**
 * Creates a rate limiter middleware instance.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000ms = 1 min)
 * @param {number} options.maxHits  - Max allowed requests per IP in the window
 * @param {string} options.message  - Custom user-facing error message
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000; // 1 minute
  const maxHits = options.maxHits || 60;
  const message = options.message || 'Too many requests. Please wait a minute before trying again.';

  // Periodic cleanup of stale IP entries every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now - record.startTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, 120000).unref();

  return function rateLimiter(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!hits.has(ip)) {
      hits.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = hits.get(ip);
    if (now - record.startTime > windowMs) {
      // Window expired, reset counter
      record.count = 1;
      record.startTime = now;
      return next();
    }

    record.count++;
    if (record.count > maxHits) {
      return res.status(429).json({
        success: false,
        error: message,
        userError: 'System busy due to high traffic. Please wait a minute before trying again.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };
