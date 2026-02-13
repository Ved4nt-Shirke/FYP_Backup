const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

router.post("/login", async (req, res) => {
  const { username, password, college, role } = req.body;

  try {
    console.log("Login attempt:", { username, password, college, role });

    // Log all users for debugging
    const allUsers = await User.find({});
    console.log(
      "All users in database:",
      allUsers.map((u) => ({
        username: u.username,
        college: u.college,
        role: u.role,
      }))
    );

    // For superadmin, we should look for college 'ALL' regardless of what's sent
    let user;
    if (role === "superadmin") {
      user = await User.findOne({ username, college: "ALL" });
    } else {
      console.log("Searching for user with:", { username, college });
      user = await User.findOne({ username, college });
      console.log("Search result:", user);

      // If not found, try searching with case insensitive username
      if (!user) {
        console.log("Trying case insensitive search...");
        user = await User.findOne({
          username: { $regex: new RegExp(`^${username}$`, "i") },
          college: college,
        });
        console.log("Case insensitive search result:", user);
      }
    }

    console.log("User found:", user);

    if (!user) {
      try {
        const LoginLog = require("../models/LoginLog");
        // For LoginLog, use the provided college and role for logging
        const logCollege = college === "ALL" ? "ALL" : college;
        const logRole = role === "superadmin" ? "admin" : role;
        await LoginLog.create({
          username,
          college: logCollege,
          role: logRole,
          success: false,
          message: "User not found",
          ip: (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            ""
          ).toString(),
          userAgent: req.headers["user-agent"],
        });
      } catch {}
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.role !== role) {
      try {
        const LoginLog = require("../models/LoginLog");
        // For LoginLog, use the provided college and role for logging
        const logCollege = college === "ALL" ? "ALL" : college;
        const logRole = role === "superadmin" ? "admin" : role;
        await LoginLog.create({
          username,
          college: logCollege,
          role: logRole,
          success: false,
          message: "Invalid role",
          ip: (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            ""
          ).toString(),
          userAgent: req.headers["user-agent"],
        });
      } catch {}
      return res.status(400).json({ msg: "Invalid role" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password comparison result:", {
      isMatch,
      providedPassword: password,
      storedHash: user.password,
    });
    if (!isMatch) {
      try {
        const LoginLog = require("../models/LoginLog");
        // For LoginLog, use the provided college and role for logging
        const logCollege = college === "ALL" ? "ALL" : college;
        const logRole = role === "superadmin" ? "admin" : role;
        await LoginLog.create({
          username,
          college: logCollege,
          role: logRole,
          success: false,
          message: "Invalid credentials",
          ip: (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            ""
          ).toString(),
          userAgent: req.headers["user-agent"],
        });
      } catch {}
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, college: user.college },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    // Log successful login
    try {
      const LoginLog = require("../models/LoginLog");
      // For LoginLog, use the provided college and role for logging
      const logCollege = user.college === "ALL" ? "ALL" : user.college;
      const logRole = user.role === "superadmin" ? "admin" : user.role;
      await LoginLog.create({
        username: user.username,
        college: logCollege,
        role: logRole,
        ip: (
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          ""
        ).toString(),
        userAgent: req.headers["user-agent"],
        success: true,
        message: "Login successful",
      });
    } catch (logErr) {
      console.error("Login logging failed:", logErr.message);
    }

    res.json({
      token,
      userName: user.username,
      role: user.role,
      college: user.college,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
