const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Institution = require("../models/Institution");

const authenticate = async (req, res, next) => {
  console.log("=== Authentication Middleware ===");
  console.log("Method:", req.method, "Path:", req.path);
  try {
    const authHeader = req.header("Authorization") || "";
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header preview:", authHeader.substring(0, 30) + "...");

    // Support standard "Bearer <token>" format, guard against 'null'/'undefined'
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    console.log("Token extracted:", !!token);

    if (!token || token.toLowerCase() === "null" || token.toLowerCase() === "undefined") {
      console.log("No valid token found");
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log("Token decoded, user ID:", decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("User not found for token");
      return res.status(401).json({ message: "Token is not valid" });
    }

    console.log("User authenticated:", user._id, "Role:", user.role);
    if (user.role !== "superadmin" && user.college && user.college !== "ALL") {
      const institution = await Institution.findOne({ code: user.college });
      if (!institution) {
        return res.status(403).json({
          message: "Institution not found for this account",
        });
      }
      if (institution.isActive === false) {
        return res.status(403).json({
          message:
            "This institute is currently inactive. Please contact the administrator.",
        });
      }
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: "Token is not valid: " + err.message });
  }
};

const authorizeAdmin = (req, res, next) => {
  console.log("Authorizing admin, user role:", req.user?.role);
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

const authorizeSuperAdmin = (req, res, next) => {
  console.log("Authorizing superadmin, user role:", req.user?.role);
  if (req.user.role !== "superadmin") {
    return res
      .status(403)
      .json({ message: "Access denied. Super admins only." });
  }
  next();
};

const authorizeOfficeStaff = (req, res, next) => {
  console.log("Authorizing office staff, user role:", req.user?.role);
  if (req.user.role !== "office") {
    return res.status(403).json({ message: "Access denied. Office staff only. Your role is: " + req.user?.role });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeOffice: authorizeOfficeStaff,
};
