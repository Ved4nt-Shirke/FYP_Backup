/**
 * Security Headers Middleware
 * Configures standard HTTP response headers to defend against:
 * 1. Clickjacking (X-Frame-Options & CSP frame-ancestors)
 * 2. MIME-sniffing (X-Content-Type-Options)
 * 3. Information exposure (Referrer-Policy)
 * 4. General XSS (Content-Security-Policy)
 */
const securityHeaders = (req, res, next) => {
  // Prevent application from being loaded in an iframe on other sites
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent browser from sniffing MIME types away from the declared Content-Type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Control referrer information sent in HTTP headers
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Set Content-Security-Policy to restrict resource execution
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none';"
  );

  next();
};

module.exports = securityHeaders;
