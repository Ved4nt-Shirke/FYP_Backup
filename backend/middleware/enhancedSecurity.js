const bcrypt = require("bcryptjs");
const User = require("../models/user");

/**
 * Enhanced security middleware for sensitive superadmin operations
 * Implements multiple layers of protection:
 * 1. Superadmin password verification
 * 2. IP whitelist checking
 * 3. Action confirmation with audit logging
 */
const enhancedSecurity = (actionType) => async (req, res, next) => {
  try {
    // Layer 1: Superadmin password verification
    const { superadminPassword } = req.body;

    if (!superadminPassword) {
      return res.status(400).json({
        success: false,
        message: "Superadmin password is required for this operation",
      });
    }

    // Determine the expected superadmin password
    // Keep this in sync with initializeSuperAdmin in server.js
    const expectedSuperadminPassword =
      process.env.SUPERADMIN_PASSWORD || "superadmin123";

    // Verify superadmin password
    const isPasswordValid =
      (await bcrypt.compare(
        superadminPassword,
        await bcrypt.hash(expectedSuperadminPassword, 10),
      )) || superadminPassword === expectedSuperadminPassword;

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid superadmin password",
      });
    }

    // Layer 2: IP Whitelist checking (if configured)
    const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const whitelistedIPs = process.env.WHITELISTED_IPS
      ? process.env.WHITELISTED_IPS.split(",")
      : [];

    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. IP address not whitelisted for sensitive operations",
      });
    }

    // Layer 3: Action confirmation with audit logging
    const { confirmation } = req.body;

    if (!confirmation || confirmation !== "CONFIRM") {
      return res.status(400).json({
        success: false,
        message:
          "Confirmation required for this operation. Please send 'confirmation: \"CONFIRM\"' in the request body",
      });
    }

    // Log the sensitive action
    try {
      const AuditLog = require("../models/AuditLog");
      await AuditLog.create({
        userId: req.user._id,
        username: req.user.username,
        action: actionType,
        resourceId: req.params.id || null,
        ipAddress: clientIP,
        userAgent: req.headers["user-agent"],
        timestamp: new Date(),
      });
    } catch (logError) {
      console.error("Audit logging failed:", logError.message);
    }

    // If all checks pass, continue to the next middleware/route handler
    next();
  } catch (error) {
    console.error("Enhanced security check failed:", error);
    res.status(500).json({
      success: false,
      message: "Security verification failed",
      error: error.message,
    });
  }
};

module.exports = enhancedSecurity;
