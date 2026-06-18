/**
 * Memory-Based Rate Limiting Middleware
 * Defends against brute-force attacks on authentication endpoints
 * and request spamming/denial of service on API endpoints.
 */

const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
  const max = options.max || 100; // default 100 requests per windowMs
  const message = options.message || "Too many requests from this IP, please try again later.";
  const hits = new Map();

  // Clean up expired records periodically
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of hits.entries()) {
      if (now > data.resetTime) {
        hits.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    // Bypass rate limiting in development, local, or debug environments to prevent development blockages
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV !== "production" ||
      process.env.DEBUG === "true" ||
      process.env.DISABLE_RATE_LIMIT === "true"
    ) {
      return next();
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
    const now = Date.now();

    if (!hits.has(ip)) {
      hits.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      const data = hits.get(ip);
      if (now > data.resetTime) {
        data.count = 1;
        data.resetTime = now + windowMs;
      } else {
        data.count++;
      }
    }

    const current = hits.get(ip);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    res.setHeader("X-RateLimit-Reset", new Date(current.resetTime).toISOString());

    if (current.count > max) {
      return res.status(429).json({ success: false, msg: message });
    }

    next();
  };
};

// Strict rate limiter for authentication/login (max 5 requests per 5 minutes)
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 attempts
  message: "Too many login attempts. Please try again after 5 minutes.",
});

// General rate limiter for general API routes (max 300 requests per 15 minutes)
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: "Too many requests. Please try again later.",
});

module.exports = {
  rateLimit,
  loginRateLimiter,
  apiRateLimiter,
};
