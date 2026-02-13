const express = require("express");
const router = express.Router();
const Ciann = require("../models/Ciann");
const Faculty = require("../models/Faculty");
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

  if (user.role === "faculty" || user.role === "office") {
    return { owner: user._id };
  }

  if (user.role === "admin") {
    return {
      $or: [{ college: user.college }, { college: { $exists: false } }],
    };
  }

  // superadmin gets everything
  return {};
}

// Helper: ensure the current user can access the CIANN
function ensureAccess(ciann, user) {
  if (!ciann || !user) return false;

  if (user.role === "superadmin") return true;

  if (user.role === "admin") {
    return !ciann.college || ciann.college === user.college;
  }

  // Faculty and office staff can only access their own CIANNs
  return ciann.owner?.toString() === user._id.toString();
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
    const cianns = await Ciann.find(filter).sort({ createdAt: -1 });
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

    const ciann = await Ciann.findOne({ ciannId: numericCiannId });
    if (!ciann) {
      return res.status(404).json({ message: "CIANN not found" });
    }

    if (!ensureAccess(ciann, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(ciann);
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

    if (!ensureAccess(existing, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const safeBody = { ...req.body, updatedAt: new Date() };
    delete safeBody.owner;
    delete safeBody.ownerUsername;
    delete safeBody.ownerRole;
    delete safeBody.college;
    delete safeBody.ciannId;
    delete safeBody.faculty;

    const updatedCiann = await Ciann.findOneAndUpdate(
      { ciannId: numericCiannId },
      safeBody,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedCiann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete CIANN
router.delete("/:ciannId", async (req, res) => {
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

    if (!ensureAccess(existing, req.user)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Ciann.deleteOne({ _id: existing._id });
    res
      .status(200)
      .json({ message: "CIANN deleted successfully", deletedCiann: existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
