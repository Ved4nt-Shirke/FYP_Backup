const express = require("express");
const router = express.Router();
const Ciann = require("../models/Ciann");
const Faculty = require("../models/Faculty");
const User = require("../models/user");
const { authenticate } = require("../middleware/auth");

// All CIANN routes require authentication to scope data per faculty
router.use(authenticate);

// Helper: generate a unique 4-digit ciannId
async function generateUniqueCiannId() {
  let unique = false;
  let ciannId;
  while (!unique) {
    ciannId = Math.floor(1000 + Math.random() * 9000);
    const exists = await Ciann.findOne({ ciannId });
    if (!exists) unique = true;
  }
  return ciannId;
}

// Helper: build base filters based on user role
function buildScopedFilter(user) {
  if (!user) return {};

  if (["faculty", "office", "hod", "academic_coordinator"].includes(user.role)) {
    return {
      $or: [{ owner: user._id }, { "sharedWith.user": user._id }],
    };
  }

  if (user.role === "admin") {
    return {
      $or: [{ college: user.college }, { college: { $exists: false } }],
    };
  }

  // superadmin gets everything
  return {};
}

function getSharedPermission(ciann, user) {
  if (!ciann || !user || !Array.isArray(ciann.sharedWith)) return null;
  const entry = ciann.sharedWith.find(
    (share) => share?.user?.toString() === user._id.toString(),
  );
  return entry?.permission || null;
}

// Request access to a CIANN by ciannId (for non-owners)
router.post("/:ciannId/request-access", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const permission = (req.body?.permission || "read").toString().trim().toLowerCase();

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    if (!["read", "edit"].includes(permission)) {
      return res.status(400).json({ message: "permission must be read or edit" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (ciann.owner?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner already has full access" });
    }

    const alreadyShared = (ciann.sharedWith || []).some(
      (share) => share.user?.toString() === req.user._id.toString(),
    );
    if (alreadyShared) {
      return res.status(400).json({ message: "You already have access to this CIANN" });
    }

    if (
      req.user.role !== "superadmin" &&
      ciann.college &&
      req.user.college !== ciann.college
    ) {
      return res.status(400).json({ message: "Cannot request CIANN access across colleges" });
    }

    const pendingIndex = (ciann.shareRequests || []).findIndex(
      (request) =>
        request.requester?.toString() === req.user._id.toString() &&
        request.status === "pending",
    );

    if (pendingIndex >= 0) {
      ciann.shareRequests[pendingIndex].permission = permission;
      ciann.shareRequests[pendingIndex].requestedAt = new Date();
    } else {
      ciann.shareRequests.push({
        requester: req.user._id,
        permission,
        status: "pending",
        requestedAt: new Date(),
      });
    }

    await ciann.save();

    return res.status(200).json({
      message: "Access request sent to CIANN owner",
      ciannId: ciann.ciannId,
      requestedPermission: permission,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get pending incoming share requests for CIANNs owned by current user
router.get("/share-requests/incoming", async (req, res) => {
  try {
    const requests = await Ciann.find({
      owner: req.user._id,
      "shareRequests.status": "pending",
    })
      .select("ciannId subject division shareRequests")
      .populate("shareRequests.requester", "username role college");

    const incoming = [];
    requests.forEach((ciann) => {
      (ciann.shareRequests || []).forEach((request) => {
        if (request.status === "pending") {
          incoming.push({
            requestId: request._id,
            ciannId: ciann.ciannId,
            subject: ciann.subject,
            division: ciann.division,
            requester: {
              userId: request.requester?._id,
              username: request.requester?.username,
              role: request.requester?.role,
              college: request.requester?.college,
            },
            permission: request.permission,
            requestedAt: request.requestedAt,
          });
        }
      });
    });

    return res.status(200).json({ incoming });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Owner accepts or rejects a share request
router.post("/:ciannId/share-requests/:requestId/respond", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const { requestId } = req.params;
    const action = (req.body?.action || "").toString().trim().toLowerCase();

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId }).populate(
      "shareRequests.requester",
      "username role college",
    );

    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can respond to share requests" });
    }

    const request = (ciann.shareRequests || []).find(
      (item) => item._id?.toString() === requestId,
    );

    if (!request) {
      return res.status(404).json({ message: "Share request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request has already been processed" });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    request.respondedAt = new Date();
    request.respondedBy = req.user._id;

    if (action === "accept") {
      const requesterId = request.requester?._id?.toString() || request.requester?.toString();
      const existingShareIndex = (ciann.sharedWith || []).findIndex(
        (share) => share.user?.toString() === requesterId,
      );

      if (existingShareIndex >= 0) {
        ciann.sharedWith[existingShareIndex].permission = request.permission;
        ciann.sharedWith[existingShareIndex].sharedBy = req.user._id;
        ciann.sharedWith[existingShareIndex].sharedAt = new Date();
      } else {
        ciann.sharedWith.push({
          user: requesterId,
          permission: request.permission,
          sharedBy: req.user._id,
          sharedAt: new Date(),
        });
      }
    }

    await ciann.save();

    return res.status(200).json({
      message: action === "accept" ? "Share request accepted" : "Share request rejected",
      ciannId: ciann.ciannId,
      requestId,
      status: request.status,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get shares for a CIANN (owner/admin/superadmin only)
router.get("/:ciannId/shares", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId }).populate(
      "sharedWith.user",
      "username role college",
    );
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can view share list" });
    }

    const shares = (ciann.sharedWith || []).map((item) => ({
      userId: item.user?._id,
      username: item.user?.username,
      role: item.user?.role,
      college: item.user?.college,
      permission: item.permission,
      sharedAt: item.sharedAt,
    }));

    res.status(200).json({ ciannId: ciann.ciannId, shares });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Share a CIANN with another user by username
router.post("/:ciannId/share", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const { username, permission } = req.body;

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "username is required" });
    }
    if (!["read", "edit"].includes(permission)) {
      return res.status(400).json({ message: "permission must be read or edit" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can share this CIANN" });
    }

    const targetUser = await User.findOne({ username: username.trim() });
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (targetUser._id.toString() === ciann.owner.toString()) {
      return res.status(400).json({ message: "Owner already has full access" });
    }

    if (
      req.user.role !== "superadmin" &&
      ciann.college &&
      targetUser.college !== ciann.college
    ) {
      return res.status(400).json({ message: "Cannot share CIANN across colleges" });
    }

    const existingShareIndex = (ciann.sharedWith || []).findIndex(
      (share) => share.user?.toString() === targetUser._id.toString(),
    );

    if (existingShareIndex >= 0) {
      ciann.sharedWith[existingShareIndex].permission = permission;
      ciann.sharedWith[existingShareIndex].sharedBy = req.user._id;
      ciann.sharedWith[existingShareIndex].sharedAt = new Date();
    } else {
      ciann.sharedWith.push({
        user: targetUser._id,
        permission,
        sharedBy: req.user._id,
        sharedAt: new Date(),
      });
    }

    await ciann.save();

    res.status(200).json({
      message: `CIANN shared with ${targetUser.username} as ${permission}`,
      ciannId: ciann.ciannId,
      sharedWith: {
        userId: targetUser._id,
        username: targetUser.username,
        permission,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove CIANN share from a user
router.delete("/:ciannId/share/:sharedUserId", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const { sharedUserId } = req.params;

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can remove shares" });
    }

    const originalLength = (ciann.sharedWith || []).length;
    ciann.sharedWith = (ciann.sharedWith || []).filter(
      (share) => share.user?.toString() !== sharedUserId,
    );

    if (ciann.sharedWith.length === originalLength) {
      return res.status(404).json({ message: "Share entry not found" });
    }

    await ciann.save();
    res.status(200).json({ message: "Share removed successfully", ciannId: ciann.ciannId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getAccessLevel(ciann, user) {
  if (!ciann || !user) return "none";

  if (user.role === "superadmin") return "owner";

  if (user.role === "admin") {
    return !ciann.college || ciann.college === user.college ? "owner" : "none";
  }

  if (ciann.owner?.toString() === user._id.toString()) return "owner";

  const sharedPermission = getSharedPermission(ciann, user);
  if (sharedPermission === "edit") return "edit";
  if (sharedPermission === "read") return "read";
  return "none";
}

function canShareCiann(ciann, user) {
  const accessLevel = getAccessLevel(ciann, user);
  return accessLevel === "owner";
}

// Helper: ensure the current user can access the CIANN
function ensureAccess(ciann, user, requiredPermission = "read") {
  const accessLevel = getAccessLevel(ciann, user);
  if (requiredPermission === "read") {
    return accessLevel === "owner" || accessLevel === "edit" || accessLevel === "read";
  }
  if (requiredPermission === "edit") {
    return accessLevel === "owner" || accessLevel === "edit";
  }
  if (requiredPermission === "owner") {
    return accessLevel === "owner";
  }
  return false;
}

// Create CIANN
router.post("/", async (req, res) => {
  try {
    const ciannId = await generateUniqueCiannId();

    // Link to faculty document if available (by email/username match)
    let facultyRef = null;
    if (req.user?.username) {
      facultyRef = await Faculty.findOne({
        generatedUsername: req.user.username,
      });
    }

    const payload = {
      ...req.body,
      ciannId,
      owner: req.user._id,
      ownerUsername: req.user.username,
      ownerRole: req.user.role,
      college: req.user.college,
      faculty: facultyRef?._id || undefined,
    };

    const saved = await Ciann.create(payload);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all CIANNs (scoped per role)
router.get("/", async (req, res) => {
  try {
    const filter = buildScopedFilter(req.user);
    let cianns = await Ciann.find(filter).sort({ createdAt: -1 });

    // Populate courseCode from Course reference
    const Course = require("../models/Course");
    cianns = await Promise.all(
      cianns.map(async (ciann) => {
        const ciannObj = ciann.toObject();
        if (!ciannObj.courseCode) {
          try {
            let course = null;

            // Try to find by courseId first (for new CIANNs)
            if (ciannObj.courseId) {
              course = await Course.findById(ciannObj.courseId).select(
                "courseCode",
              );
            }

            // If not found, try to find by semester and department (for old CIANNs)
            if (!course && ciannObj.semester && ciannObj.department) {
              const deptId = ciannObj.department._id || ciannObj.department;
              course = await Course.findOne({
                semester: parseInt(ciannObj.semester),
                departmentId: deptId,
              }).select("courseCode _id");

              // Store the courseId for future use
              if (course) {
                ciannObj.courseId = course._id;
              }
            }

            if (course) {
              ciannObj.courseCode = course.courseCode;
              console.log(
                `✓ CIANN ${ciannObj.ciannId}: Found courseCode ${course.courseCode}`,
              );
            } else {
              console.log(`✗ CIANN ${ciannObj.ciannId}: Could not find course`);
            }
          } catch (err) {
            console.error(
              `Error fetching course for CIANN ${ciannObj.ciannId}:`,
              err.message,
            );
          }
        }
        ciannObj.accessLevel = getAccessLevel(ciann, req.user);
        ciannObj.canShare = canShareCiann(ciann, req.user);
        return ciannObj;
      }),
    );

    res.status(200).json(cianns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get CIANN by ID
router.get("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    let ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Populate courseCode if it doesn't exist
    const ciannObj = ciann.toObject();
    if (!ciannObj.courseCode) {
      try {
        const Course = require("../models/Course");
        let course = null;

        // Try to find by courseId first
        if (ciannObj.courseId) {
          course = await Course.findById(ciannObj.courseId).select(
            "courseCode",
          );
        }

        // If not found, try by semester and department
        if (!course && ciannObj.semester && ciannObj.department) {
          const deptId = ciannObj.department._id || ciannObj.department;
          course = await Course.findOne({
            semester: parseInt(ciannObj.semester),
            departmentId: deptId,
          }).select("courseCode _id");

          if (course) {
            ciannObj.courseId = course._id;
          }
        }

        if (course) {
          ciannObj.courseCode = course.courseCode;
        }
      } catch (err) {
        console.error(
          `Could not find course for CIANN ${ciannObj.ciannId}:`,
          err.message,
        );
      }
    }

    ciannObj.accessLevel = getAccessLevel(ciann, req.user);
    ciannObj.canShare = canShareCiann(ciann, req.user);
    res.status(200).json(ciannObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update CIANN
router.put("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const existing = await Ciann.findOne({ ciannId: numericCiannId });
    if (!existing) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(existing, req.user, "edit")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const safeBody = { ...req.body, updatedAt: new Date() };
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.ciannId;
    delete safeBody.faculty;
    delete safeBody.sharedWith;

    const updatedCiann = await Ciann.findOneAndUpdate(
      { ciannId: numericCiannId },
      safeBody,
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCiann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete CIANN with password authentication and cascade delete all related data
router.delete("/:ciannId", async (req, res) => {
  try {
    const { ciannId } = req.params;
    const { password } = req.body;
    const numericCiannId = parseInt(ciannId);

    if (isNaN(numericCiannId)) {
      return res.status(400).json({ message: "Invalid ciannId format" });
    }

    const existing = await Ciann.findOne({ ciannId: numericCiannId });
    if (!existing) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(existing, req.user, "owner")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify password only if user is faculty, HOD, or Academic Coordinator
    if (["faculty", "hod", "academic_coordinator"].includes(req.user.role)) {
      if (!password) {
        return res.status(400).json({
          message: "Password is required to delete CIANN",
          requiresPassword: true,
        });
      }

      // Get faculty details and verify password
      const Faculty = require("../models/Faculty");
      const User = require("../models/user");
      const bcryptjs = require("bcryptjs");

      const user = await User.findById(req.user._id);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isPasswordValid = await bcryptjs.compare(
        password,
        user.password,
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password. CIANN not deleted.",
          success: false,
        });
      }
    }

    // Delete all related data for this CIANN
    console.log(`🗑️ Deleting CIANN ${ciannId} and all related data...`);

    // Import models for cascade delete
    const Assessment = require("../models/Assessment");
    const CTMarks = require("../models/CTMarks");
    const StudentResult = require("../models/StudentResult");
    const TheoryAttendance = require("../models/TheoryAttendance");
    const PracticalAttendance = require("../models/PracticalAttendance");
    const TutorialAttendance = require("../models/TutorialAttendance");
    const ExtraAttendance = require("../models/ExtraAttendance");
    const ExtraPract = require("../models/ExtraPract");
    const PracticalExam = require("../models/PracticalExam");
    const PTMicroProject = require("../models/PTMicroProject");
    const AuditLog = require("../models/AuditLog");

    // Step 1: Delete all assessments related to this CIANN
    await Assessment.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted assessments");

    // Step 2: Delete all CT marks related to this CIANN
    await CTMarks.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted CT marks");

    // Step 3: Delete all student results related to this CIANN
    await StudentResult.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted student results");

    // Step 4: Delete all theory attendance records for this CIANN
    await TheoryAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted theory attendance");

    // Step 5: Delete all practical attendance records for this CIANN
    await PracticalAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted practical attendance");

    // Step 6: Delete all tutorial attendance records for this CIANN
    await TutorialAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted tutorial attendance");

    // Step 7: Delete all extra attendance records for this CIANN
    await ExtraAttendance.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted extra attendance");

    // Step 8: Delete all PT microproject marks for this CIANN
    await PTMicroProject.deleteMany({ ciannId: existing.ciannId });
    console.log("   ✓ Deleted PT microproject marks");

    // Step 8: Delete all extra practical records for this CIANN
    await ExtraPract.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted extra practical");

    // Step 9: Delete all practical exams for this CIANN
    await PracticalExam.deleteMany({ ciannId: existing._id });
    console.log("   ✓ Deleted practical exams");

    // Step 10: Delete audit logs related to this CIANN
    await AuditLog.deleteMany({
      resourceId: existing._id,
      resourceType: "Ciann",
    });
    console.log("   ✓ Deleted audit logs");

    // Step 11: Finally delete the CIANN record itself
    await Ciann.deleteOne({ _id: existing._id });
    console.log("   ✓ Deleted CIANN record");

    res.status(200).json({
      message: "CIANN and all related data deleted successfully",
      deletedCiann: existing,
      success: true,
    });
  } catch (err) {
    console.error("Error deleting CIANN:", err);
    res.status(500).json({
      message: "Failed to delete CIANN",
      error: err.message,
    });
  }
});

module.exports = router;
