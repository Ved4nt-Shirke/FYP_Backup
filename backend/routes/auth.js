const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Student = require("../models/Student");
const Institution = require("../models/Institution");

router.post("/login", async (req, res) => {
  // Trim whitespace from inputs
  const username = (req.body.username || "").trim();
  const password = req.body.password || "";
  const college = (req.body.college || "").trim();
  const role = (req.body.role || "").trim();
  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedCollege = college.toUpperCase();

  try {
    console.log("Login attempt:", { username, college, role });

    // Log all users for debugging
    const allUsers = await User.find({});
    console.log(
      "All users in database:",
      allUsers.map((u) => ({
        username: u.username,
        college: u.college,
        role: u.role,
      })),
      "Total users:", allUsers.length
    );

    // For superadmin, we should look for college 'ALL' regardless of what's sent
    let user;
    let studentProfile = null;

    if (role !== "superadmin" && (!college || normalizedCollege === "ALL")) {
      return res.status(400).json({
        msg: "Please select a valid institution",
      });
    }

    if (role === "superadmin") {
      user = await User.findOne({ username, college: "ALL" });
    } else if (role === "student") {
      // Authenticate student against User model (hashed password source)
      console.log("Student login attempt - searching in User model");
      user = await User.findOne({
        username: { $regex: new RegExp(`^${normalizedUsername}$`, "i") },
        role: "student",
        college: normalizedCollege,
      });

      if (user) {
        studentProfile = await Student.findOne({
          username: { $regex: new RegExp(`^${normalizedUsername}$`, "i") },
        });
      }

      console.log(
        "Student user/profile search result:",
        user
          ? {
              username: user.username,
              role: user.role,
              hasProfile: !!studentProfile,
            }
          : null,
      );
    } else {
      console.log("Searching for user with:", { username, college, role });

      // First try exact match
      user = await User.findOne({ username, college: normalizedCollege, role });
      console.log("Exact match result:", user);

      // If not found, try case insensitive username and college
      if (!user) {
        console.log("Trying case insensitive search on username and college...");
        user = await User.findOne({
          username: { $regex: new RegExp(`^${username}$`, "i") },
          college: { $regex: new RegExp(`^${normalizedCollege}$`, "i") },
          role,
        });
        console.log("Case insensitive search result:", user);
      }
    }

    console.log("User found:", user);

    if (!user) {
      try {
        const LoginLog = require("../models/LoginLog");
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
      } catch { }

      // More detailed error message for debugging
      const errorMsg = role === "admin"
        ? `Admin user "${username}" not found for institution "${college}". Please ensure the admin account was created for this institution.`
        : `${role} user "${username}" not found for college "${college}"`;

      return res.status(400).json({ msg: errorMsg });
    }

    // Validate role - skip for students since we set their role dynamically
    if (role !== "student" && user.role !== role) {
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
      } catch { }
      return res.status(400).json({ msg: "Invalid role" });
    }

    if (role !== "superadmin" && user.college && user.college !== "ALL") {
      const institution = await Institution.findOne({ code: user.college });
      if (!institution || institution.isActive === false) {
        try {
          const LoginLog = require("../models/LoginLog");
          const logCollege = user.college === "ALL" ? "ALL" : user.college;
          const logRole = role === "superadmin" ? "admin" : role;
          await LoginLog.create({
            username,
            college: logCollege,
            role: logRole,
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
      } catch { }
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        college: user.college,
        ...(role === "student" && {
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

    // Build response with student-specific fields if applicable
    let institutionData = null;
    if (user.college && user.college !== "ALL") {
      institutionData = await Institution.findOne(
        { code: user.college },
        "name code logoUrl palette",
      );
    }

    const response = {
      token,
      userName: user.username,
      role: user.role,
      college: user.college,
      institutionName: institutionData?.name || "",
      institutionCode: institutionData?.code || user.college,
      institutionLogoUrl: institutionData?.logoUrl || "",
      institutionPalette: institutionData?.palette || null,
    };

    if (role === "student") {
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

module.exports = router;
