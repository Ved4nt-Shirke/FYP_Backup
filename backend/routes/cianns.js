const express = require("express");
const router = express.Router();
const Ciann = require("../models/Ciann");
const Faculty = require("../models/Faculty");
const User = require("../models/user");
const CiannCollaborationLog = require("../models/CiannCollaborationLog");
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/auth");
const checkCiannFreeze = require("../middleware/checkFreeze");

const escapeRegex = (string) => String(string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    (share) => {
      const shareUserId = (share?.user?._id || share?.user)?.toString();
      return shareUserId === user._id.toString();
    }
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

    if ((ciann.owner?._id || ciann.owner)?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner already has full access" });
    }

    const alreadyShared = (ciann.sharedWith || []).some(
      (share) => (share.user?._id || share.user)?.toString() === req.user._id.toString(),
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

    // Create in-app notification for the CIANN owner
    try {
      const newNotification = new Notification({
        recipient: ciann.owner,
        sender: req.user._id,
        ciannId: ciann.ciannId,
        type: "access_request",
        message: `${req.user.username} requested ${permission} access to your CIANN ${ciann.ciannId} (${ciann.subject?.name || ""})`,
      });
      await newNotification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

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
          const requesterId = request.requester?._id || request.requester;
          incoming.push({
            requestId: request._id,
            ciannId: ciann.ciannId,
            subject: ciann.subject,
            division: ciann.division,
            requester: {
              userId: requesterId?._id || requesterId,
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

// Get pending outgoing share requests sent by current user
router.get("/share-requests/outgoing", async (req, res) => {
  try {
    const requests = await Ciann.find({
      "shareRequests.requester": req.user._id,
      "shareRequests.status": "pending",
    })
      .select("ciannId subject division owner ownerUsername shareRequests")
      .populate("owner", "username role college");

    const outgoing = [];
    requests.forEach((ciann) => {
      (ciann.shareRequests || []).forEach((request) => {
        const reqIdStr = (request.requester?._id || request.requester)?.toString();
        if (
          reqIdStr === req.user._id.toString() &&
          request.status === "pending"
        ) {
          const ownerId = ciann.owner?._id || ciann.owner;
          outgoing.push({
            requestId: request._id,
            ciannId: ciann.ciannId,
            subject: ciann.subject,
            division: ciann.division,
            owner: {
              userId: ownerId?._id || ownerId,
              username: ciann.ownerUsername || ciann.owner?.username,
              role: ciann.owner?.role,
            },
            permission: request.permission,
            requestedAt: request.requestedAt,
          });
        }
      });
    });

    return res.status(200).json({ outgoing });
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
        (share) => (share.user?._id || share.user)?.toString() === requesterId,
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

    // Create in-app notification for the requester
    try {
      const requesterId = request.requester?._id || request.requester;
      const isAccepted = action === "accept";
      const notification = new Notification({
        recipient: requesterId,
        sender: req.user._id,
        ciannId: ciann.ciannId,
        type: isAccepted ? "access_approved" : "access_rejected",
        message: `Your request for CIANN ${ciann.ciannId} (${ciann.subject?.name || ""}) access has been ${isAccepted ? "APPROVED" : "REJECTED"} as ${request.permission} by the owner.`,
      });
      await notification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

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
router.post("/:ciannId/share", checkCiannFreeze, async (req, res) => {
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
      (share) => (share.user?._id || share.user)?.toString() === targetUser._id.toString(),
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

    // Create notification for target user
    try {
      const notification = new Notification({
        recipient: targetUser._id,
        sender: req.user._id,
        ciannId: ciann.ciannId,
        type: "access_approved",
        message: `${req.user.username} shared CIANN ${ciann.ciannId} (${ciann.subject?.name || ""}) with you as ${permission}.`,
      });
      await notification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

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
router.delete("/:ciannId/share/:sharedUserId", checkCiannFreeze, async (req, res) => {
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
      (share) => (share.user?._id || share.user)?.toString() !== sharedUserId,
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

  const ownerId = (ciann.owner?._id || ciann.owner)?.toString();
  if (ownerId === user._id.toString()) return "owner";

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
    // Check if CIANN with same subject, division, semester, academicYear, and college already exists
    const exists = await Ciann.findOne({
      college: req.user.college,
      division: req.body.division,
      semester: req.body.semester?.toString(),
      academicYear: req.body.academicYear,
      $or: [
        { "subject._id": req.body.subject?._id },
        { "subject.code": req.body.subject?.code }
      ]
    });
    if (exists) {
      return res.status(400).json({
        message: `A CIANN for subject ${req.body.subject?.name || ""} (${req.body.subject?.code || ""}), Division ${req.body.division}, Semester ${req.body.semester} for Academic Year ${req.body.academicYear} already exists in your institution.`
      });
    }

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

    // Auto-link to active academic year
    try {
      const AcademicYear = require("../models/AcademicYear");
      const activeYear = await AcademicYear.findOne({
        college: req.user.college,
        status: "active",
      });
      if (activeYear) {
        payload.academicYearRef = activeYear._id;
        if (!payload.scheme) {
          payload.scheme = activeYear.scheme;
        }
      }
    } catch (ayErr) {
      console.error("Failed to auto-link academic year:", ayErr.message);
    }

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

    const { all, academicYear } = req.query;
    if (academicYear) {
      try {
        const matches = academicYear.match(/(\d{4})\s*-\s*(\d{2,4})/);
        let ayFilter;
        if (matches) {
          const startYear = matches[1];
          const endYear = matches[2];
          const shortEndYear = endYear.length === 4 ? endYear.slice(2) : endYear;
          const longEndYear = endYear.length === 2 ? (startYear.slice(0, 2) + endYear) : endYear;
          const pattern = `^${startYear}\\s*-\\s*(?:${shortEndYear}|${longEndYear})$`;
          ayFilter = { $regex: new RegExp(pattern, "i") };
        } else {
          ayFilter = { $regex: new RegExp(`^${escapeRegex(academicYear)}$`, "i") };
        }
        
        filter.$and = filter.$and || [];
        filter.$and.push({ academicYear: ayFilter });
      } catch (err) {
        console.error("Failed to apply academicYear filter:", err.message);
      }
    } else if (all !== "true") {
      // Filter by active academic year by default
      try {
        const AcademicYear = require("../models/AcademicYear");
        const activeYear = await AcademicYear.findOne({
          college: req.user.college,
          status: "active",
        });
        if (activeYear) {
          filter.$and = filter.$and || [];
          filter.$and.push({
            $or: [
              { academicYearRef: activeYear._id },
              { academicYear: { $regex: new RegExp(`^${escapeRegex(activeYear.name)}$`, "i") } }
            ]
          });
        }
      } catch (ayErr) {
        console.error("Failed to filter CIANNs by active academic year:", ayErr.message);
      }
    }

    let cianns = await Ciann.find(filter)
      .populate("owner", "username role")
      .populate("sharedWith.user", "username role")
      .populate("shareRequests.requester", "username role")
      .sort({ createdAt: -1 });

    // Populate courseCode from Course reference
    const Course = require("../models/Course");
    cianns = await Promise.all(
      cianns.map(async (ciann) => {
        const ciannObj = ciann.toObject();
        if (!ciannObj.courseCode || !ciannObj.scheme) {
          try {
            let course = null;

            // Try to find by courseId first (for new CIANNs)
            if (ciannObj.courseId) {
              course = await Course.findById(ciannObj.courseId).select(
                "courseCode scheme",
              );
            }

            // If not found, try to find by semester and department (for old CIANNs)
            if (!course && ciannObj.semester && ciannObj.department) {
              const deptId = ciannObj.department._id || ciannObj.department;
              course = await Course.findOne({
                semester: parseInt(ciannObj.semester),
                departmentId: deptId,
              }).select("courseCode scheme _id");

              // Store the courseId for future use
              if (course) {
                ciannObj.courseId = course._id;
              }
            }

            if (course) {
              ciannObj.courseCode = course.courseCode;
              ciannObj.scheme = course.scheme;
              console.log(
                `✓ CIANN ${ciannObj.ciannId}: Found courseCode ${course.courseCode} and scheme ${course.scheme}`,
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

    let ciann = await Ciann.findOne({ ciannId: numericCiannId })
      .populate("owner", "username role")
      .populate("sharedWith.user", "username role")
      .populate("shareRequests.requester", "username role")
      .populate("comments.user", "username role");
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Populate courseCode if it doesn't exist
    const ciannObj = ciann.toObject();
    if (!ciannObj.courseCode || !ciannObj.scheme) {
      try {
        const Course = require("../models/Course");
        let course = null;

        // Try to find by courseId first
        if (ciannObj.courseId) {
          course = await Course.findById(ciannObj.courseId).select(
            "courseCode scheme",
          );
        }

        // If not found, try by semester and department
        if (!course && ciannObj.semester && ciannObj.department) {
          const deptId = ciannObj.department._id || ciannObj.department;
          course = await Course.findOne({
            semester: parseInt(ciannObj.semester),
            departmentId: deptId,
          }).select("courseCode scheme _id");

          if (course) {
            ciannObj.courseId = course._id;
          }
        }

        if (course) {
          ciannObj.courseCode = course.courseCode;
          ciannObj.scheme = course.scheme;
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
router.put("/:ciannId", checkCiannFreeze, async (req, res) => {
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
router.delete("/:ciannId", checkCiannFreeze, async (req, res) => {
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

// Get CIANNs owned by a specific user (by username)
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const college = req.user.college;

    const targetUser = await User.findOne({ username, college });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const cianns = await Ciann.find({
      owner: targetUser._id,
      college
    }).select("ciannId subject division class academicYear semester");

    res.json({ success: true, cianns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sync CIANN workspace edits and check for conflicts
router.post("/:ciannId/sync", checkCiannFreeze, async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const { ciannData, lastSyncedAt, section, details } = req.body;

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

    // Conflict detection:
    // If database updatedAt is newer than the client's lastSyncedAt, AND the last editor was NOT the current user
    if (lastSyncedAt && existing.updatedAt) {
      const dbTime = new Date(existing.updatedAt).getTime();
      const syncTime = new Date(lastSyncedAt).getTime();
      
      const latestLog = await CiannCollaborationLog.findOne({ ciannId: existing._id })
        .sort({ timestamp: -1 });

      if (dbTime > syncTime && latestLog && latestLog.userId?.toString() !== req.user._id?.toString()) {
        return res.status(409).json({
          conflict: true,
          message: `Conflict detected! ${latestLog.username} updated this CIANN on ${new Date(existing.updatedAt).toLocaleTimeString()}. Please resolve conflicts or reload.`,
          updatedAt: existing.updatedAt,
          dbCiannData: existing,
        });
      }
    }

    // No conflict, perform save
    const safeBody = { ...ciannData, updatedAt: new Date() };
    delete safeBody._id;
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.ciannId;
    delete safeBody.sharedWith;
    delete safeBody.shareRequests;
    delete safeBody.comments;

    const updated = await Ciann.findOneAndUpdate(
      { ciannId: numericCiannId },
      safeBody,
      { new: true }
    );

    // Save collaboration log
    const log = new CiannCollaborationLog({
      ciannId: existing._id,
      userId: req.user._id,
      username: req.user.username,
      section: section || "General",
      action: "updated",
      details: details || "Updated CIANN workspace",
      timestamp: new Date()
    });
    await log.save();

    // Create notifications for other collaborators
    const notificationRecipients = [];
    if (existing.owner?.toString() !== req.user._id?.toString()) {
      notificationRecipients.push(existing.owner);
    }
    (existing.sharedWith || []).forEach((share) => {
      const colId = share.user?._id || share.user;
      if (colId?.toString() !== req.user._id?.toString() && !notificationRecipients.includes(colId)) {
        notificationRecipients.push(colId);
      }
    });

    for (const recipientId of notificationRecipients) {
      const notification = new Notification({
        recipient: recipientId,
        sender: req.user._id,
        ciannId: existing.ciannId,
        type: "ciann_updated",
        message: `${req.user.username} updated the ${section || "General"} section of CIANN ${existing.ciannId}.`,
      });
      await notification.save();
    }

    res.json({ success: true, ciann: updated, updatedAt: updated.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to CIANN
router.post("/:ciannId/comments", checkCiannFreeze, async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    ciann.comments.push({
      user: req.user._id,
      username: req.user.username,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await ciann.save();

    // Create notifications for owner and other collaborators
    const recipients = [];
    if (ciann.owner?.toString() !== req.user._id?.toString()) {
      recipients.push(ciann.owner);
    }
    (ciann.sharedWith || []).forEach((share) => {
      const colId = share.user?._id || share.user;
      if (colId?.toString() !== req.user._id?.toString() && !recipients.includes(colId)) {
        recipients.push(colId);
      }
    });

    for (const recipientId of recipients) {
      const notification = new Notification({
        recipient: recipientId,
        sender: req.user._id,
        ciannId: ciann.ciannId,
        type: "comment_added",
        message: `${req.user.username} commented on CIANN ${ciann.ciannId}: "${comment.substring(0, 30)}..."`,
      });
      await notification.save();
    }

    res.json({ success: true, comments: ciann.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch collaboration logs / version history for CIANN
router.get("/:ciannId/collaboration-logs", async (req, res) => {
  try {
    const numericCiannId = parseInt(req.params.ciannId);
    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const logs = await CiannCollaborationLog.find({ ciannId: ciann._id })
      .populate("userId", "username role")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
