const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const EBook = require("../models/EBook");
const Student = require("../models/Student");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/ebooks");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${cleanedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "coverImage") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Cover image must be an image file!"), false);
    }
  } else if (file.fieldname === "bookFile") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("E-Book file must be a PDF document!"), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max size
});

// Helper: Authorize office staff and admin
const authorizeOfficeOrAdmin = (req, res, next) => {
  if (
    req.user.role === "office" ||
    req.user.role === "admin" ||
    req.user.role === "superadmin"
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Office staff and administrators only.",
    });
  }
};

// --- ROUTES ---

/**
 * @route   POST /api/ebooks
 * @desc    Add a new eBook (with cover image and PDF file)
 * @access  Private (Office/Admin)
 */
router.post(
  "/",
  authenticate,
  authorizeOfficeOrAdmin,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bookFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, publicationName } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: "Title is required." });
      }

      if (!req.files || !req.files.bookFile) {
        return res
          .status(400)
          .json({ success: false, message: "E-Book PDF file is required." });
      }

      // Parse authors, domains, and mappings from request body
      let authors = [];
      if (req.body.authors) {
        try {
          authors = JSON.parse(req.body.authors);
        } catch (e) {
          authors = String(req.body.authors)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
        }
      }

      let domains = [];
      if (req.body.domains) {
        try {
          domains = JSON.parse(req.body.domains);
        } catch (e) {
          domains = String(req.body.domains)
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
        }
      }

      let mappings = [];
      if (req.body.mappings) {
        try {
          mappings = JSON.parse(req.body.mappings);
        } catch (e) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid mappings format." });
        }
      }

      const bookFile = req.files.bookFile[0];
      const coverImage = req.files.coverImage ? req.files.coverImage[0] : null;

      const filePath = `uploads/ebooks/${bookFile.filename}`;
      const coverImagePath = coverImage ? `uploads/ebooks/${coverImage.filename}` : "";

      const newEBook = new EBook({
        title,
        authors,
        publicationName: publicationName || "",
        domains,
        filePath,
        coverImagePath,
        mappings,
        institution: req.user.college,
        uploadedBy: req.user._id,
      });

      await newEBook.save();

      return res.status(201).json({
        success: true,
        message: "E-Book added successfully.",
        ebook: newEBook,
      });
    } catch (err) {
      console.error("Error creating eBook:", err);
      // Clean up uploaded files in case of error
      if (req.files) {
        if (req.files.bookFile) {
          fs.unlinkSync(req.files.bookFile[0].path);
        }
        if (req.files.coverImage) {
          fs.unlinkSync(req.files.coverImage[0].path);
        }
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * @route   GET /api/ebooks
 * @desc    Get all eBooks (filtered by student's department/course or faculty department)
 * @access  Private (All Authenticated)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const institution = req.user.college;
    const { role } = req.user;

    let filter = { institution };

    if (role === "student") {
      // Find student profile matching the username
      const student = await Student.findOne({
        username: new RegExp(`^${req.user.username}$`, "i"),
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }

      // Filter eBooks mapped to the student's department and course
      filter["mappings"] = {
        $elemMatch: {
          departmentId: student.departmentId,
          courseId: student.courseId,
        },
      };
    } else if (role === "faculty" || role === "hod" || role === "academic_coordinator") {
      // Prioritize department filter if HOD/faculty is from a department
      if (req.user.department) {
        filter["mappings"] = {
          $elemMatch: {
            departmentId: req.user.department,
          },
        };
      }
    }

    // If query params are provided, allow filtering
    const { departmentId, courseId, subjectId, search } = req.query;

    if (departmentId && departmentId !== "all") {
      filter["mappings.departmentId"] = departmentId;
    }
    if (courseId && courseId !== "all") {
      filter["mappings.courseId"] = courseId;
    }
    if (subjectId && subjectId !== "all") {
      filter["mappings.subjectId"] = subjectId;
    }

    // Text search or regex search
    if (search) {
      filter["$or"] = [
        { title: { $regex: search, $options: "i" } },
        { authors: { $regex: search, $options: "i" } },
        { publicationName: { $regex: search, $options: "i" } },
        { domains: { $regex: search, $options: "i" } },
      ];
    }

    const ebooks = await EBook.find(filter)
      .populate("mappings.departmentId", "name code")
      .populate("mappings.courseId", "semester courseCode scheme")
      .populate("mappings.subjectId", "name code")
      .sort({ createdAt: -1 });

    return res.json({ success: true, ebooks });
  } catch (err) {
    console.error("Error fetching eBooks:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/ebooks/:id
 * @desc    Get details of a single eBook
 * @access  Private (All Authenticated)
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const ebook = await EBook.findOne({
      _id: req.params.id,
      institution: req.user.college,
    })
      .populate("mappings.departmentId", "name code")
      .populate("mappings.courseId", "semester courseCode scheme")
      .populate("mappings.subjectId", "name code");

    if (!ebook) {
      return res.status(404).json({ success: false, message: "E-Book not found." });
    }

    return res.json({ success: true, ebook });
  } catch (err) {
    console.error("Error fetching eBook details:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   PUT /api/ebooks/:id
 * @desc    Update eBook details and/or files
 * @access  Private (Office/Admin)
 */
router.put(
  "/:id",
  authenticate,
  authorizeOfficeOrAdmin,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bookFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const ebook = await EBook.findOne({
        _id: req.params.id,
        institution: req.user.college,
      });

      if (!ebook) {
        // Clean up uploaded files since the book is not found
        if (req.files) {
          if (req.files.bookFile) fs.unlinkSync(req.files.bookFile[0].path);
          if (req.files.coverImage) fs.unlinkSync(req.files.coverImage[0].path);
        }
        return res.status(404).json({ success: false, message: "E-Book not found." });
      }

      const { title, publicationName } = req.body;

      if (title) ebook.title = title;
      if (publicationName !== undefined) ebook.publicationName = publicationName;

      // Update authors, domains, and mappings
      if (req.body.authors) {
        try {
          ebook.authors = JSON.parse(req.body.authors);
        } catch (e) {
          ebook.authors = String(req.body.authors)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
        }
      }

      if (req.body.domains) {
        try {
          ebook.domains = JSON.parse(req.body.domains);
        } catch (e) {
          ebook.domains = String(req.body.domains)
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
        }
      }

      if (req.body.mappings) {
        try {
          ebook.mappings = JSON.parse(req.body.mappings);
        } catch (e) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid mappings format." });
        }
      }

      // Handle new files
      if (req.files) {
        if (req.files.bookFile) {
          // Remove old book file
          const oldBookPath = path.join(__dirname, "..", ebook.filePath);
          if (fs.existsSync(oldBookPath)) {
            fs.unlinkSync(oldBookPath);
          }
          // Set new book path
          ebook.filePath = `uploads/ebooks/${req.files.bookFile[0].filename}`;
        }

        if (req.files.coverImage) {
          // Remove old cover image if it exists
          if (ebook.coverImagePath) {
            const oldCoverPath = path.join(__dirname, "..", ebook.coverImagePath);
            if (fs.existsSync(oldCoverPath)) {
              fs.unlinkSync(oldCoverPath);
            }
          }
          // Set new cover image
          ebook.coverImagePath = `uploads/ebooks/${req.files.coverImage[0].filename}`;
        }
      }

      await ebook.save();

      return res.json({
        success: true,
        message: "E-Book updated successfully.",
        ebook,
      });
    } catch (err) {
      console.error("Error updating eBook:", err);
      // Clean up uploaded files in case of error
      if (req.files) {
        if (req.files.bookFile) fs.unlinkSync(req.files.bookFile[0].path);
        if (req.files.coverImage) fs.unlinkSync(req.files.coverImage[0].path);
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

/**
 * @route   DELETE /api/ebooks/:id
 * @desc    Delete an eBook (cleans up associated files)
 * @access  Private (Office/Admin)
 */
router.delete("/:id", authenticate, authorizeOfficeOrAdmin, async (req, res) => {
  try {
    const ebook = await EBook.findOne({
      _id: req.params.id,
      institution: req.user.college,
    });

    if (!ebook) {
      return res.status(404).json({ success: false, message: "E-Book not found." });
    }

    // Delete associated files from the disk
    const bookFilePath = path.join(__dirname, "..", ebook.filePath);
    if (fs.existsSync(bookFilePath)) {
      fs.unlinkSync(bookFilePath);
    }

    if (ebook.coverImagePath) {
      const coverImagePath = path.join(__dirname, "..", ebook.coverImagePath);
      if (fs.existsSync(coverImagePath)) {
        fs.unlinkSync(coverImagePath);
      }
    }

    await EBook.deleteOne({ _id: ebook._id });

    return res.json({
      success: true,
      message: "E-Book deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting eBook:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
