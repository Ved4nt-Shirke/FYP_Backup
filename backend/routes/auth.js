const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/Student");
const Institution = require("../models/Institution");
const { loginRateLimiter } = require("../middleware/rateLimiter");

router.post("/login", loginRateLimiter, async (req, res) => {
  // Trim whitespace from inputs
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";

  try {
    let user;
    let studentProfile = null;

    // 1. Try exact match first
    user = await User.findOne({ username });

    // 2. If not found, try case insensitive search
    if (!user) {
      const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") }
      });
    }

    // 3. If still not found, try normalized username (student style)
    if (!user) {
      const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizedUsername !== username.toLowerCase()) {
        user = await User.findOne({
          username: { $regex: new RegExp(`^${normalizedUsername}$`, "i") }
        });
      }
    }

    if (!user) {
      try {
        const LoginLog = require("../models/LoginLog");
        await LoginLog.create({
          username,
          college: "UNKNOWN",
          role: "UNKNOWN",
          success: false,
          message: "User not found",
          ip: (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            ""
          ).toString(),
          userAgent: req.headers["user-agent"],
        });
      } catch { }

      return res.status(400).json({ msg: `User "${username}" not found` });
    }

    const resolvedRole = user.role;
    const resolvedCollege = user.college;

    if (resolvedRole === "student") {
      const normalizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
      studentProfile = await Student.findOne({
        username: { $regex: new RegExp(`^${normalizedUsername}$`, "i") },
      });

    }

    if (resolvedRole !== "superadmin" && resolvedCollege && resolvedCollege !== "ALL") {
      const institution = await Institution.findOne({ code: resolvedCollege });
      if (!institution || institution.isActive === false) {
        try {
          const LoginLog = require("../models/LoginLog");
          await LoginLog.create({
            username: user.username,
            college: resolvedCollege,
            role: resolvedRole,
            success: false,
            message: "Institution inactive",
            ip: (
              req.headers["x-forwarded-for"] ||
              req.socket.remoteAddress ||
              ""
            ).toString(),
            userAgent: req.headers["user-agent"],
          });
        } catch { }
        return res.status(403).json({
          msg: "This institute is currently inactive. Please contact the administrator.",
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      try {
        const LoginLog = require("../models/LoginLog");
        await LoginLog.create({
          username: user.username,
          college: resolvedCollege,
          role: resolvedRole,
          success: false,
          message: "Invalid credentials",
          ip: (
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            ""
          ).toString(),
          userAgent: req.headers["user-agent"],
        });
      } catch { }
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Intercept Superadmin login for Two-Factor Authentication (2FA)
    if (resolvedRole === "superadmin") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const TwoFactorToken = require("../models/TwoFactorToken");
      await TwoFactorToken.deleteMany({ userId: user._id });
      await TwoFactorToken.create({ userId: user._id, token: otp });

      const { send2FACode } = require("../utils/mailer");
      const targetEmail = process.env.SUPERADMIN_2FA_EMAIL || "prasad.koyande@vpt.edu.in";
      let emailSent = false;
      try {
        const mailResult = await send2FACode(targetEmail, otp);
        emailSent = mailResult.sent;
      } catch (mailErr) {
        console.error("Failed to email 2FA code:", mailErr.message);
      }

      return res.json({
        twoFactorRequired: true,
        userId: user._id,
        email: targetEmail,
        msg: "Two-factor authentication code sent to registered email.",
        emailSent,
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: resolvedRole,
        college: resolvedCollege,
        ...(resolvedRole === "student" && {
          enrollmentNo: studentProfile?.enrollmentNo,
          studentName: studentProfile?.studentName,
        })
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: "24h",
      },
    );

    // Log successful login
    try {
      const LoginLog = require("../models/LoginLog");
      await LoginLog.create({
        username: user.username,
        college: resolvedCollege,
        role: resolvedRole,
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

    // Build response with student-specific fields if applicable
    let institutionData = null;
    if (resolvedCollege && resolvedCollege !== "ALL") {
      institutionData = await Institution.findOne(
        { code: resolvedCollege },
        "name code logoUrl palette",
      );
    }

    const response = {
      token,
      userName: user.username,
      role: resolvedRole,
      college: resolvedCollege,
      institutionName: institutionData?.name || "",
      institutionCode: institutionData?.code || resolvedCollege,
      institutionLogoUrl: institutionData?.logoUrl || "",
      institutionPalette: institutionData?.palette || null,
    };

    if (resolvedRole === "student") {
      response.enrollmentNo = studentProfile?.enrollmentNo;
      response.studentName = studentProfile?.studentName;
      response.rollNo = studentProfile?.rollNo;
      response.batch = studentProfile?.batch;
      response.division = studentProfile?.division;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");

const profilePhotoDir = path.join(__dirname, "../uploads/profile-photos");
if (!fs.existsSync(profilePhotoDir)) {
  fs.mkdirSync(profilePhotoDir, { recursive: true });
}

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    const name = (req.user?.username || "profile")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PNG, JPEG/JPG, and WEBP profile photos are allowed"));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// GET /api/auth/profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    let profile = null;
    if (user.role === "faculty") {
      const Faculty = require("../models/Faculty");
      profile = await Faculty.findOne({ generatedUsername: user.username }).populate("department", "name code");
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        college: user.college,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error fetching profile", error: err.message });
  }
});

// PUT /api/auth/profile
router.put("/profile", authenticate, profilePhotoUpload.single("profilePhoto"), async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (user.role !== "faculty") {
      return res.status(403).json({ msg: "Only faculty can edit their profile details" });
    }

    const Faculty = require("../models/Faculty");
    const facultyProfile = await Faculty.findOne({ generatedUsername: user.username });
    if (!facultyProfile) {
      return res.status(404).json({ msg: "Faculty profile not found" });
    }

    const { email, whatsappPhone, password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Password verification is required to update profile details" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password. Verification failed." });
    }

    // Email validation & uniqueness
    if (email && email.toLowerCase().trim() !== facultyProfile.email.toLowerCase()) {
      const trimmedEmail = email.toLowerCase().trim();
      const emailExists = await Faculty.findOne({ email: trimmedEmail });
      if (emailExists) {
        return res.status(400).json({ msg: "Email is already in use by another faculty member" });
      }
      facultyProfile.email = trimmedEmail;
    }

    if (whatsappPhone !== undefined) {
      facultyProfile.whatsappPhone = (whatsappPhone || "").toString().trim();
    }

    if (req.file) {
      // Delete old photo if it exists to clean up disk storage
      if (facultyProfile.profilePhoto) {
        const oldPath = path.join(__dirname, "..", facultyProfile.profilePhoto);
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn("Failed to delete old profile photo:", err.message);
          }
        });
      }
      facultyProfile.profilePhoto = `/uploads/profile-photos/${req.file.filename}`;
    }

    await facultyProfile.save();

    res.json({
      success: true,
      msg: "Profile updated successfully",
      profile: facultyProfile,
    });
  } catch (err) {
    console.error("Profile update failed:", err);
    res.status(500).json({ msg: "Server error updating profile", error: err.message });
  }
});

// POST /api/auth/verify-2fa
router.post("/verify-2fa", loginRateLimiter, async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ msg: "Missing user identification or verification code" });
  }

  try {
    const User = require("../models/user");
    const user = await User.findById(userId);
    if (!user || user.role !== "superadmin") {
      return res.status(400).json({ msg: "Invalid user request" });
    }

    const TwoFactorToken = require("../models/TwoFactorToken");
    const activeToken = await TwoFactorToken.findOne({ userId: user._id });

    if (!activeToken) {
      return res.status(400).json({ msg: "Verification code expired or not requested" });
    }

    if (activeToken.token !== code.trim()) {
      return res.status(400).json({ msg: "Incorrect verification code" });
    }

    // Delete the token so it cannot be reused
    await TwoFactorToken.deleteOne({ _id: activeToken._id });

    // Generate final JWT token
    const resolvedRole = user.role;
    const resolvedCollege = user.college;

    const token = jwt.sign(
      {
        id: user._id,
        role: resolvedRole,
        college: resolvedCollege,
      },
      process.env.JWT_SECRET || "your-secret-key",
      {
        expiresIn: "24h",
      },
    );

    // Log successful login
    try {
      const LoginLog = require("../models/LoginLog");
      await LoginLog.create({
        username: user.username,
        college: resolvedCollege,
        role: resolvedRole,
        ip: (
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          ""
        ).toString(),
        userAgent: req.headers["user-agent"],
        success: true,
        message: "2FA Login successful",
      });
    } catch (logErr) {
      console.error("Login logging failed:", logErr.message);
    }

    const Institution = require("../models/Institution");
    let institutionData = null;
    if (resolvedCollege && resolvedCollege !== "ALL") {
      institutionData = await Institution.findOne(
        { code: resolvedCollege },
        "name code logoUrl palette",
      );
    }

    const response = {
      token,
      userName: user.username,
      role: resolvedRole,
      college: resolvedCollege,
      institutionName: institutionData?.name || "",
      institutionCode: institutionData?.code || resolvedCollege,
      institutionLogoUrl: institutionData?.logoUrl || "",
      institutionPalette: institutionData?.palette || null,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ msg: "Server error during verification", error: err.message });
  }
});

module.exports = router;
