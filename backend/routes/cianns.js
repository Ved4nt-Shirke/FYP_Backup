const express = require("express");
const router = express.Router();
const Ciaan = require("../models/Ciann");
const Faculty = require("../models/Faculty");
const User = require("../models/user");
const CiaanCollaborationLog = require("../models/CiannCollaborationLog");
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/auth");
const checkCiaanFreeze = require("../middleware/checkFreeze");

// All Ciaan routes require authentication to scope data per faculty
router.use(authenticate);

// Helper: generate a unique 4-digit CiaanId
async function generateUniqueCiaanId() {
  let unique = false;
  let CiaanId;
  while (!unique) {
    CiaanId = Math.floor(1000 + Math.random() * 9000);
    const exists = await Ciaan.findOne({ CiaanId });
    if (!exists) unique = true;
  }
  return CiaanId;
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

function getSharedPermission(Ciaan, user) {
  if (!Ciaan || !user || !Array.isArray(Ciaan.sharedWith)) return null;
  const entry = Ciaan.sharedWith.find(
    (share) => {
      const shareUserId = (share?.user?._id || share?.user)?.toString();
      return shareUserId === user._id.toString();
    }
  );
  return entry?.permission || null;
}

// Request access to a Ciaan by CiaanId (for non-owners)
router.post("/:CiaanId/request-access", async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const permission = (req.body?.permission || "read").toString().trim().toLowerCase();

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    if (!["read", "edit"].includes(permission)) {
      return res.status(400).json({ message: "permission must be read or edit" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if ((ciaanDoc.owner?._id || ciaanDoc.owner)?.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Owner already has full access" });
    }

    const alreadyShared = (ciaanDoc.sharedWith || []).some(
      (share) => (share.user?._id || share.user)?.toString() === req.user._id.toString(),
    );
    if (alreadyShared) {
      return res.status(400).json({ message: "You already have access to this Ciaan" });
    }

    if (
      req.user.role !== "superadmin" &&
      ciaanDoc.college &&
      req.user.college !== ciaanDoc.college
    ) {
      return res.status(400).json({ message: "Cannot request Ciaan access across colleges" });
    }

    const pendingIndex = (ciaanDoc.shareRequests || []).findIndex(
      (request) =>
        request.requester?.toString() === req.user._id.toString() &&
        request.status === "pending",
    );

    if (pendingIndex >= 0) {
      ciaanDoc.shareRequests[pendingIndex].permission = permission;
      ciaanDoc.shareRequests[pendingIndex].requestedAt = new Date();
    } else {
      ciaanDoc.shareRequests.push({
        requester: req.user._id,
        permission,
        status: "pending",
        requestedAt: new Date(),
      });
    }

    await ciaanDoc.save();

    // Create in-app notification for the Ciaan owner
    try {
      const newNotification = new Notification({
        recipient: ciaanDoc.owner,
        sender: req.user._id,
        CiaanId: ciaanDoc.CiaanId,
        type: "access_request",
        message: `${req.user.username} requested ${permission} access to your Ciaan ${ciaanDoc.CiaanId} (${ciaanDoc.subject?.name || ""})`,
      });
      await newNotification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

    return res.status(200).json({
      message: "Access request sent to Ciaan owner",
      CiaanId: ciaanDoc.CiaanId,
      requestedPermission: permission,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get pending incoming share requests for Ciaans owned by current user
router.get("/share-requests/incoming", async (req, res) => {
  try {
    const requests = await Ciaan.find({
      owner: req.user._id,
      "shareRequests.status": "pending",
    })
      .select("CiaanId subject division shareRequests")
      .populate("shareRequests.requester", "username role college");

    const incoming = [];
    requests.forEach((Ciaan) => {
      (Ciaan.shareRequests || []).forEach((request) => {
        if (request.status === "pending") {
          const requesterId = request.requester?._id || request.requester;
          incoming.push({
            requestId: request._id,
            CiaanId: Ciaan.CiaanId,
            subject: Ciaan.subject,
            division: Ciaan.division,
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
    const requests = await Ciaan.find({
      "shareRequests.requester": req.user._id,
      "shareRequests.status": "pending",
    })
      .select("CiaanId subject division owner ownerUsername shareRequests")
      .populate("owner", "username role college");

    const outgoing = [];
    requests.forEach((Ciaan) => {
      (Ciaan.shareRequests || []).forEach((request) => {
        const reqIdStr = (request.requester?._id || request.requester)?.toString();
        if (
          reqIdStr === req.user._id.toString() &&
          request.status === "pending"
        ) {
          const ownerId = Ciaan.owner?._id || Ciaan.owner;
          outgoing.push({
            requestId: request._id,
            CiaanId: Ciaan.CiaanId,
            subject: Ciaan.subject,
            division: Ciaan.division,
            owner: {
              userId: ownerId?._id || ownerId,
              username: Ciaan.ownerUsername || Ciaan.owner?.username,
              role: Ciaan.owner?.role,
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
router.post("/:CiaanId/share-requests/:requestId/respond", async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const { requestId } = req.params;
    const action = (req.body?.action || "").toString().trim().toLowerCase();

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId }).populate(
      "shareRequests.requester",
      "username role college",
    );

    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can respond to share requests" });
    }

    const request = (ciaanDoc.shareRequests || []).find(
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
      const existingShareIndex = (ciaanDoc.sharedWith || []).findIndex(
        (share) => (share.user?._id || share.user)?.toString() === requesterId,
      );

      if (existingShareIndex >= 0) {
        ciaanDoc.sharedWith[existingShareIndex].permission = request.permission;
        ciaanDoc.sharedWith[existingShareIndex].sharedBy = req.user._id;
        ciaanDoc.sharedWith[existingShareIndex].sharedAt = new Date();
      } else {
        ciaanDoc.sharedWith.push({
          user: requesterId,
          permission: request.permission,
          sharedBy: req.user._id,
          sharedAt: new Date(),
        });
      }
    }

    await ciaanDoc.save();

    // Create in-app notification for the requester
    try {
      const requesterId = request.requester?._id || request.requester;
      const isAccepted = action === "accept";
      const notification = new Notification({
        recipient: requesterId,
        sender: req.user._id,
        CiaanId: ciaanDoc.CiaanId,
        type: isAccepted ? "access_approved" : "access_rejected",
        message: `Your request for Ciaan ${ciaanDoc.CiaanId} (${ciaanDoc.subject?.name || ""}) access has been ${isAccepted ? "APPROVED" : "REJECTED"} as ${request.permission} by the owner.`,
      });
      await notification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

    return res.status(200).json({
      message: action === "accept" ? "Share request accepted" : "Share request rejected",
      CiaanId: ciaanDoc.CiaanId,
      requestId,
      status: request.status,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get shares for a Ciaan (owner/admin/superadmin only)
router.get("/:CiaanId/shares", async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId }).populate(
      "sharedWith.user",
      "username role college",
    );
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can view share list" });
    }

    const shares = (ciaanDoc.sharedWith || []).map((item) => ({
      userId: item.user?._id,
      username: item.user?.username,
      role: item.user?.role,
      college: item.user?.college,
      permission: item.permission,
      sharedAt: item.sharedAt,
    }));

    res.status(200).json({ CiaanId: ciaanDoc.CiaanId, shares });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Share a Ciaan with another user by username
router.post("/:CiaanId/share", checkCiaanFreeze, async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const { username, permission } = req.body;

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "username is required" });
    }
    if (!["read", "edit"].includes(permission)) {
      return res.status(400).json({ message: "permission must be read or edit" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can share this Ciaan" });
    }

    const targetUser = await User.findOne({ username: username.trim() });
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    if (targetUser._id.toString() === ciaanDoc.owner.toString()) {
      return res.status(400).json({ message: "Owner already has full access" });
    }

    if (
      req.user.role !== "superadmin" &&
      ciaanDoc.college &&
      targetUser.college !== ciaanDoc.college
    ) {
      return res.status(400).json({ message: "Cannot share Ciaan across colleges" });
    }

    const existingShareIndex = (ciaanDoc.sharedWith || []).findIndex(
      (share) => (share.user?._id || share.user)?.toString() === targetUser._id.toString(),
    );

    if (existingShareIndex >= 0) {
      ciaanDoc.sharedWith[existingShareIndex].permission = permission;
      ciaanDoc.sharedWith[existingShareIndex].sharedBy = req.user._id;
      ciaanDoc.sharedWith[existingShareIndex].sharedAt = new Date();
    } else {
      ciaanDoc.sharedWith.push({
        user: targetUser._id,
        permission,
        sharedBy: req.user._id,
        sharedAt: new Date(),
      });
    }

    await ciaanDoc.save();

    // Create notification for target user
    try {
      const notification = new Notification({
        recipient: targetUser._id,
        sender: req.user._id,
        CiaanId: ciaanDoc.CiaanId,
        type: "access_approved",
        message: `${req.user.username} shared Ciaan ${ciaanDoc.CiaanId} (${ciaanDoc.subject?.name || ""}) with you as ${permission}.`,
      });
      await notification.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

    res.status(200).json({
      message: `Ciaan shared with ${targetUser.username} as ${permission}`,
      CiaanId: ciaanDoc.CiaanId,
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

// Remove Ciaan share from a user
router.delete("/:CiaanId/share/:sharedUserId", checkCiaanFreeze, async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const { sharedUserId } = req.params;

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "owner")) {
      return res.status(403).json({ message: "Only owner can remove shares" });
    }

    const originalLength = (ciaanDoc.sharedWith || []).length;
    ciaanDoc.sharedWith = (ciaanDoc.sharedWith || []).filter(
      (share) => (share.user?._id || share.user)?.toString() !== sharedUserId,
    );

    if (ciaanDoc.sharedWith.length === originalLength) {
      return res.status(404).json({ message: "Share entry not found" });
    }

    await ciaanDoc.save();
    res.status(200).json({ message: "Share removed successfully", CiaanId: ciaanDoc.CiaanId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getAccessLevel(Ciaan, user) {
  if (!Ciaan || !user) return "none";

  if (user.role === "superadmin") return "owner";

  if (user.role === "admin") {
    return !Ciaan.college || Ciaan.college === user.college ? "owner" : "none";
  }

  const ownerId = (Ciaan.owner?._id || Ciaan.owner)?.toString();
  if (ownerId === user._id.toString()) return "owner";

  const sharedPermission = getSharedPermission(Ciaan, user);
  if (sharedPermission === "edit") return "edit";
  if (sharedPermission === "read") return "read";
  return "none";
}

function canShareCiaan(Ciaan, user) {
  const accessLevel = getAccessLevel(Ciaan, user);
  return accessLevel === "owner";
}

// Helper: ensure the current user can access the Ciaan
function ensureAccess(Ciaan, user, requiredPermission = "read") {
  const accessLevel = getAccessLevel(Ciaan, user);
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

// Create Ciaan
router.post("/", async (req, res) => {
  try {
    // Check if Ciaan with same subject, division, semester, academicYear, and college already exists
    const exists = await Ciaan.findOne({
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
        message: `A Ciaan for subject ${req.body.subject?.name || ""} (${req.body.subject?.code || ""}), Division ${req.body.division}, Semester ${req.body.semester} for Academic Year ${req.body.academicYear} already exists in your institution.`
      });
    }

    const CiaanId = await generateUniqueCiaanId();

    // Link to faculty document if available (by email/username match)
    let facultyRef = null;
    if (req.user?.username) {
      facultyRef = await Faculty.findOne({
        generatedUsername: req.user.username,
      });
    }

    const payload = {
      ...req.body,
      CiaanId,
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

    const saved = await Ciaan.create(payload);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all Ciaans (scoped per role)
router.get("/", async (req, res) => {
  try {
    const filter = buildScopedFilter(req.user);
    let Ciaans = await Ciaan.find(filter)
      .populate("owner", "username role")
      .populate("sharedWith.user", "username role")
      .populate("shareRequests.requester", "username role")
      .sort({ createdAt: -1 });

    // Populate courseCode from Course reference
    const Course = require("../models/Course");
    Ciaans = await Promise.all(
      Ciaans.map(async (Ciaan) => {
        const CiaanObj = Ciaan.toObject();
        if (!CiaanObj.courseCode || !CiaanObj.scheme) {
          try {
            let course = null;

            // Try to find by courseId first (for new Ciaans)
            if (CiaanObj.courseId) {
              course = await Course.findById(CiaanObj.courseId).select(
                "courseCode scheme",
              );
            }

            // If not found, try to find by semester and department (for old Ciaans)
            if (!course && CiaanObj.semester && CiaanObj.department) {
              const deptId = CiaanObj.department._id || CiaanObj.department;
              course = await Course.findOne({
                semester: parseInt(CiaanObj.semester),
                departmentId: deptId,
              }).select("courseCode scheme _id");

              // Store the courseId for future use
              if (course) {
                CiaanObj.courseId = course._id;
              }
            }

            if (course) {
              CiaanObj.courseCode = course.courseCode;
              CiaanObj.scheme = course.scheme;
              console.log(
                `✓ Ciaan ${CiaanObj.CiaanId}: Found courseCode ${course.courseCode} and scheme ${course.scheme}`,
              );
            } else {
              console.log(`✗ Ciaan ${CiaanObj.CiaanId}: Could not find course`);
            }
          } catch (err) {
            console.error(
              `Error fetching course for Ciaan ${CiaanObj.CiaanId}:`,
              err.message,
            );
          }
        }
        CiaanObj.accessLevel = getAccessLevel(Ciaan, req.user);
        CiaanObj.canShare = canShareCiaan(Ciaan, req.user);
        return CiaanObj;
      }),
    );

    res.status(200).json(Ciaans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Ciaan by ID
router.get("/:CiaanId", async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    let ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId })
      .populate("owner", "username role")
      .populate("sharedWith.user", "username role")
      .populate("shareRequests.requester", "username role")
      .populate("comments.user", "username role");
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Populate courseCode if it doesn't exist
    const CiaanObj = ciaanDoc.toObject();
    if (!CiaanObj.courseCode || !CiaanObj.scheme) {
      try {
        const Course = require("../models/Course");
        let course = null;

        // Try to find by courseId first
        if (CiaanObj.courseId) {
          course = await Course.findById(CiaanObj.courseId).select(
            "courseCode scheme",
          );
        }

        // If not found, try by semester and department
        if (!course && CiaanObj.semester && CiaanObj.department) {
          const deptId = CiaanObj.department._id || CiaanObj.department;
          course = await Course.findOne({
            semester: parseInt(CiaanObj.semester),
            departmentId: deptId,
          }).select("courseCode scheme _id");

          if (course) {
            CiaanObj.courseId = course._id;
          }
        }

        if (course) {
          CiaanObj.courseCode = course.courseCode;
          CiaanObj.scheme = course.scheme;
        }
      } catch (err) {
        console.error(
          `Could not find course for Ciaan ${CiaanObj.CiaanId}:`,
          err.message,
        );
      }
    }

    CiaanObj.accessLevel = getAccessLevel(ciaanDoc, req.user);
    CiaanObj.canShare = canShareCiaan(ciaanDoc, req.user);
    res.status(200).json(CiaanObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Ciaan
router.put("/:CiaanId", checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    const existing = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!existing) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(existing, req.user, "edit")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const safeBody = { ...req.body, updatedAt: new Date() };
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.CiaanId;
    delete safeBody.faculty;
    delete safeBody.sharedWith;

    const updatedCiaan = await Ciaan.findOneAndUpdate(
      { CiaanId: numericCiaanId },
      safeBody,
      { new: true, runValidators: true },
    );

    res.status(200).json(updatedCiaan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Ciaan with password authentication and cascade delete all related data
router.delete("/:CiaanId", checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const { password } = req.body;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    const existing = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!existing) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(existing, req.user, "owner")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify password only if user is faculty, HOD, or Academic Coordinator
    if (["faculty", "hod", "academic_coordinator"].includes(req.user.role)) {
      if (!password) {
        return res.status(400).json({
          message: "Password is required to delete Ciaan",
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
          message: "Invalid password. Ciaan not deleted.",
          success: false,
        });
      }
    }

    // Delete all related data for this Ciaan
    console.log(`🗑️ Deleting Ciaan ${CiaanId} and all related data...`);

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

    // Step 1: Delete all assessments related to this Ciaan
    await Assessment.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted assessments");

    // Step 2: Delete all CT marks related to this Ciaan
    await CTMarks.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted CT marks");

    // Step 3: Delete all student results related to this Ciaan
    await StudentResult.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted student results");

    // Step 4: Delete all theory attendance records for this Ciaan
    await TheoryAttendance.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted theory attendance");

    // Step 5: Delete all practical attendance records for this Ciaan
    await PracticalAttendance.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted practical attendance");

    // Step 6: Delete all tutorial attendance records for this Ciaan
    await TutorialAttendance.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted tutorial attendance");

    // Step 7: Delete all extra attendance records for this Ciaan
    await ExtraAttendance.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted extra attendance");

    // Step 8: Delete all PT microproject marks for this Ciaan
    await PTMicroProject.deleteMany({ CiaanId: existing.CiaanId });
    console.log("   ✓ Deleted PT microproject marks");

    // Step 8: Delete all extra practical records for this Ciaan
    await ExtraPract.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted extra practical");

    // Step 9: Delete all practical exams for this Ciaan
    await PracticalExam.deleteMany({ CiaanId: existing._id });
    console.log("   ✓ Deleted practical exams");

    // Step 10: Delete audit logs related to this Ciaan
    await AuditLog.deleteMany({
      resourceId: existing._id,
      resourceType: "Ciaan",
    });
    console.log("   ✓ Deleted audit logs");

    // Step 11: Finally delete the Ciaan record itself
    await Ciaan.deleteOne({ _id: existing._id });
    console.log("   ✓ Deleted Ciaan record");

    res.status(200).json({
      message: "Ciaan and all related data deleted successfully",
      deletedCiaan: existing,
      success: true,
    });
  } catch (err) {
    console.error("Error deleting Ciaan:", err);
    res.status(500).json({
      message: "Failed to delete Ciaan",
      error: err.message,
    });
  }
});

// Get Ciaans owned by a specific user (by username)
router.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const college = req.user.college;

    const targetUser = await User.findOne({ username, college });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const Ciaans = await Ciaan.find({
      owner: targetUser._id,
      college
    }).select("CiaanId subject division class academicYear semester");

    res.json({ success: true, Ciaans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sync Ciaan workspace edits and check for conflicts
router.post("/:CiaanId/sync", checkCiaanFreeze, async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const { CiaanData, lastSyncedAt, section, details } = req.body;

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: "Invalid CiaanId format" });
    }

    const existing = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!existing) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(existing, req.user, "edit")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Conflict detection:
    // If database updatedAt is newer than the client's lastSyncedAt, AND the last editor was NOT the current user
    if (lastSyncedAt && existing.updatedAt) {
      const dbTime = new Date(existing.updatedAt).getTime();
      const syncTime = new Date(lastSyncedAt).getTime();

      const latestLog = await CiaanCollaborationLog.findOne({ CiaanId: existing._id })
        .sort({ timestamp: -1 });

      if (dbTime > syncTime && latestLog && latestLog.userId?.toString() !== req.user._id?.toString()) {
        return res.status(409).json({
          conflict: true,
          message: `Conflict detected! ${latestLog.username} updated this Ciaan on ${new Date(existing.updatedAt).toLocaleTimeString()}. Please resolve conflicts or reload.`,
          updatedAt: existing.updatedAt,
          dbCiaanData: existing,
        });
      }
    }

    // No conflict, perform save
    const safeBody = { ...CiaanData, updatedAt: new Date() };
    delete safeBody._id;
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.CiaanId;
    delete safeBody.sharedWith;
    delete safeBody.shareRequests;
    delete safeBody.comments;

    const updated = await Ciaan.findOneAndUpdate(
      { CiaanId: numericCiaanId },
      safeBody,
      { new: true }
    );

    // Save collaboration log
    const log = new CiaanCollaborationLog({
      CiaanId: existing._id,
      userId: req.user._id,
      username: req.user.username,
      section: section || "General",
      action: "updated",
      details: details || "Updated Ciaan workspace",
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
        CiaanId: existing.CiaanId,
        type: "Ciaan_updated",
        message: `${req.user.username} updated the ${section || "General"} section of Ciaan ${existing.CiaanId}.`,
      });
      await notification.save();
    }

    res.json({ success: true, Ciaan: updated, updatedAt: updated.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to Ciaan
router.post("/:CiaanId/comments", checkCiaanFreeze, async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    ciaanDoc.comments.push({
      user: req.user._id,
      username: req.user.username,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    await ciaanDoc.save();

    // Create notifications for owner and other collaborators
    const recipients = [];
    if (ciaanDoc.owner?.toString() !== req.user._id?.toString()) {
      recipients.push(ciaanDoc.owner);
    }
    (ciaanDoc.sharedWith || []).forEach((share) => {
      const colId = share.user?._id || share.user;
      if (colId?.toString() !== req.user._id?.toString() && !recipients.includes(colId)) {
        recipients.push(colId);
      }
    });

    for (const recipientId of recipients) {
      const notification = new Notification({
        recipient: recipientId,
        sender: req.user._id,
        CiaanId: ciaanDoc.CiaanId,
        type: "comment_added",
        message: `${req.user.username} commented on Ciaan ${ciaanDoc.CiaanId}: "${comment.substring(0, 30)}..."`,
      });
      await notification.save();
    }

    res.json({ success: true, comments: ciaanDoc.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch collaboration logs / version history for Ciaan
router.get("/:CiaanId/collaboration-logs", async (req, res) => {
  try {
    const numericCiaanId = parseInt(req.params.CiaanId);
    const ciaanDoc = await Ciaan.findOne({ CiaanId: numericCiaanId });
    if (!ciaanDoc) {
      return res.status(404).json({ message: "Ciaan not found" });
    }

    if (!ensureAccess(ciaanDoc, req.user, "read")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const logs = await CiaanCollaborationLog.find({ CiaanId: ciaanDoc._id })
      .populate("userId", "username role")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
