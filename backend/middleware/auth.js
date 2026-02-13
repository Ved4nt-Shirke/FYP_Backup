const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authenticate = async (req, res, next) => {
  console.log("Authentication middleware called for:", req.method, req.path);
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

const authorizeOffice = (req, res, next) => {
  if (
    req.user.role !== "office" &&
    req.user.role !== "admin" &&
    req.user.role !== "superadmin"
  ) {
    return res
      .status(403)
      .json({ message: "Access denied. Office staff or admins only." });
  }
  next();
};

const authorizeSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res
      .status(403)
      .json({ message: "Access denied. Super admins only." });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeOffice,
  authorizeSuperAdmin,
};
