/**
 * Security Headers Middleware
 * Configures standard HTTP response headers to defend against:
 * 1. Clickjacking (X-Frame-Options & CSP frame-ancestors)
 * 2. MIME-sniffing (X-Content-Type-Options)
 * 3. Information exposure (Referrer-Policy)
 * 4. General XSS (Content-Security-Policy)
 */
const securityHeaders = (req, res, next) => {
  // Allow uploads to be framed (needed for PDF viewing)
  if (req.path.startsWith("/uploads/")) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self' http://localhost:5173 http://localhost:5000 https://vpciaan.in https://www.vpciaan.in;"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    return next();
  }

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
