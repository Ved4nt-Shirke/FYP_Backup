const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { authenticate } = require("../middleware/auth");
const { enforceOwnership } = require("../middleware/ownership");
const PracticalExam = require("../models/PracticalExam");
const PracticalExamSubmission = require("../models/PracticalExamSubmission");
const Student = require("../models/Student");
const Ciann = require("../models/Ciann");

const normalizeUsername = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCaseInsensitiveRegex = (value = "") =>
  new RegExp(`^${escapeRegex(String(value || "").trim())}$`, "i");

async function findStudentForRequest(user) {
  const normalized = normalizeUsername(user.username || "");

  let student = await Student.findOne({
    username: { $regex: getCaseInsensitiveRegex(normalized) },
  });

  if (!student && user.enrollmentNo) {
    student = await Student.findOne({ enrollmentNo: user.enrollmentNo });
  }

  if (!student && normalized) {
    student = await Student.findOne({ enrollmentNo: normalized });
  }

  return student;
}

function pickAssignedQuestion(exam, student) {
  if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
    return null;
  }

  const seed = `${student._id}-${exam._id}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }

  return exam.questions[hash % exam.questions.length];
}

function isStudentAllowedForExam(exam, student, userCollege) {
  const collegeMatches = getCaseInsensitiveRegex(userCollege || "").test(String(exam.college || ""));
  const studentDivision = String(student.division || "").trim();
  const divisionMatches = (exam.divisions || []).some((division) =>
    getCaseInsensitiveRegex(studentDivision).test(String(division || ""))
  );

  const batch = String(exam.batch || "").trim();
  const studentBatch = String(student.batch || "").trim();
  const batchMatches =
    !batch ||
    /^general$/i.test(batch) ||
    (studentBatch && getCaseInsensitiveRegex(studentBatch).test(batch));

  return collegeMatches && divisionMatches && batchMatches;
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/practical-exam-submissions");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

// Middleware to authenticate all practical exam routes
router.use(authenticate);

// Get unique divisions for the faculty's batch/CIANN from office staff data
router.get("/divisions", async (req, res) => {
  try {
    const { batchId } = req.query;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "batchId is required",
      });
    }

    // Get the CIANN to find the batch
    const ciann = await Ciann.findById(batchId);
    if (!ciann) {
      return res.status(404).json({
        success: false,
        message: "CIANN not found",
      });
    }

    // Get all CIANNs with the same batch/class to find all divisions
    const allCiannsInBatch = await Ciann.find({
      class: ciann.class,
      college: ciann.college,
    }).select("division");

    // Extract unique divisions from CIANNs
    let divisions = [...new Set(allCiannsInBatch.map((c) => c.division).filter((d) => d))];

    // If no divisions found in CIANNs, try Division collection
    if (divisions.length === 0) {
      const Division = require("../models/Division");
      const divisionDocs = await Division.find({}).select("name");
      divisions = divisionDocs.map((d) => d.name);
    }

    res.json({
      success: true,
      divisions: divisions.filter((d) => d), // Remove empty strings
    });
  } catch (error) {
    console.error("Error fetching divisions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching divisions",
      error: error.message,
    });
  }
});

// Create a new practical exam
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      divisions,
      batch,
      totalMarks,
      duration,
      questions,
    } = req.body;

    if (!title || !Array.isArray(divisions) || divisions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title and divisions are required",
      });
    }

    const newPracticalExam = new PracticalExam({
      title,
      description,
      divisions,
      batch: batch || "General", // Default to General if not provided
      totalMarks: totalMarks || 100,
      duration: duration || 120,
      questions: questions || [],
      createdBy: req.user.username,
      owner: req.user._id,
      institution: req.user.college,
      college: req.user.college,
    });

    await newPracticalExam.save();

    res.status(201).json({
      success: true,
      message: "Practical exam created successfully",
      practicalExam: newPracticalExam,
    });
  } catch (error) {
    console.error("Error creating practical exam:", error);
    res.status(500).json({
      success: false,
      message: "Error creating practical exam",
      error: error.message,
    });
  }
});

// Get all practical exams for the faculty
router.get("/", async (req, res) => {
  try {
    const { batch } = req.query;

    let query = { owner: req.user._id };
    if (batch) {
      query.batch = batch;
    }

    const practicalExams = await PracticalExam.find(query).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      practicalExams,
    });
  } catch (error) {
    console.error("Error fetching practical exams:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching practical exams",
      error: error.message,
    });
  }
});

// Student: Get available practical exams for their division
router.get("/submissions/available-exams", authenticate, async (req, res) => {
  try {
    console.log("Fetching available exams for user:", req.user._id, "Role:", req.user.role);

    const student = await findStudentForRequest(req.user);
    const collegeRegex = getCaseInsensitiveRegex(req.user.college || "");

    if (!student) {
      console.log("Student not found by username, trying to find from CIANNs");
      // For now, return exams based on the user's role
      // Students should see enabled practical exams
      const exams = await PracticalExam.find({
        isEnabled: true,
        college: { $regex: collegeRegex },
      }).select("_id title duration totalMarks batch divisions");

      return res.json({
        success: true,
        exams,
        message: "Fetched all available exams (student record not found)",
      });
    }

    console.log("Student found:", student.division, student.batch);

    const normalizedDivision = String(student.division || "").trim();
    const normalizedBatch = String(student.batch || "").trim();

    const batchScope = [
      { batch: { $regex: /^general$/i } },
      { batch: { $exists: false } },
      { batch: null },
      { batch: "" },
    ];

    if (normalizedBatch) {
      batchScope.unshift({ batch: { $regex: getCaseInsensitiveRegex(normalizedBatch) } });
    }

    const examQuery = {
      isEnabled: true,
      college: { $regex: collegeRegex },
      $or: batchScope,
    };

    // Get exams for student's division and batch (or General batch)
    if (normalizedDivision) {
      examQuery.divisions = {
        $elemMatch: { $regex: getCaseInsensitiveRegex(normalizedDivision) },
      };
    }

    const exams = await PracticalExam.find(examQuery).select(
      "_id title duration totalMarks batch divisions"
    );

    res.json({
      success: true,
      exams,
    });
  } catch (error) {
    console.error("Error fetching available exams:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available exams",
      error: error.message,
    });
  }
});

// Student: Get exam details and one assigned question
router.get("/submissions/exam/:examId", authenticate, async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await PracticalExam.findById(examId).select(
      "_id title description totalMarks duration batch divisions questions isEnabled college"
    );

    if (!exam || !exam.isEnabled) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const student = await findStudentForRequest(req.user);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found",
      });
    }

    if (!isStudentAllowedForExam(exam, student, req.user.college)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this exam",
      });
    }

    const assignedQuestion = pickAssignedQuestion(exam, student);

    const existingSubmission = await PracticalExamSubmission.findOne({
      examId,
      studentId: student._id,
    }).select("submittedAt fileName marks feedback");

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        totalMarks: exam.totalMarks,
        duration: exam.duration,
        batch: exam.batch,
        divisions: exam.divisions,
      },
      assignedQuestion: assignedQuestion
        ? {
            questionNumber: assignedQuestion.questionNumber,
            questionText: assignedQuestion.questionText,
            marks: assignedQuestion.marks,
            difficulty: assignedQuestion.difficulty,
          }
        : null,
      submission: existingSubmission || null,
    });
  } catch (error) {
    console.error("Error fetching student exam details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exam details",
      error: error.message,
    });
  }
});

// Get a specific practical exam by ID
router.get("/:id", async (req, res) => {
  try {
    const practicalExam = await PracticalExam.findById(req.params.id);

    if (!practicalExam) {
      return res.status(404).json({
        success: false,
        message: "Practical exam not found",
      });
    }

    // Check ownership
    if (practicalExam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      practicalExam,
    });
  } catch (error) {
    console.error("Error fetching practical exam:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching practical exam",
      error: error.message,
    });
  }
});

// Update a practical exam
router.put("/:id", async (req, res) => {
  try {
    const { title, description, divisions, totalMarks, duration, questions, isEnabled } = req.body;

    let practicalExam = await PracticalExam.findById(req.params.id);

    if (!practicalExam) {
      return res.status(404).json({
        success: false,
        message: "Practical exam not found",
      });
    }

    // Check ownership
    if (practicalExam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update fields
    if (title) practicalExam.title = title;
    if (description) practicalExam.description = description;
    if (divisions) practicalExam.divisions = divisions;
    if (totalMarks) practicalExam.totalMarks = totalMarks;
    if (duration) practicalExam.duration = duration;
    if (questions) practicalExam.questions = questions;
    if (typeof isEnabled === "boolean") practicalExam.isEnabled = isEnabled;

    practicalExam.updatedAt = new Date();
    await practicalExam.save();

    res.json({
      success: true,
      message: "Practical exam updated successfully",
      practicalExam,
    });
  } catch (error) {
    console.error("Error updating practical exam:", error);
    res.status(500).json({
      success: false,
      message: "Error updating practical exam",
      error: error.message,
    });
  }
});

// Toggle enable/disable for a practical exam
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const practicalExam = await PracticalExam.findById(req.params.id);

    if (!practicalExam) {
      return res.status(404).json({
        success: false,
        message: "Practical exam not found",
      });
    }

    // Check ownership
    if (practicalExam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    practicalExam.isEnabled = !practicalExam.isEnabled;
    await practicalExam.save();

    res.json({
      success: true,
      message: `Practical exam ${practicalExam.isEnabled ? "enabled" : "disabled"} successfully`,
      practicalExam,
    });
  } catch (error) {
    console.error("Error toggling practical exam status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling practical exam status",
      error: error.message,
    });
  }
});

// Delete a practical exam
router.delete("/:id", async (req, res) => {
  try {
    const practicalExam = await PracticalExam.findById(req.params.id);

    if (!practicalExam) {
      return res.status(404).json({
        success: false,
        message: "Practical exam not found",
      });
    }

    // Check ownership
    if (practicalExam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await PracticalExam.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Practical exam deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting practical exam:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting practical exam",
      error: error.message,
    });
  }
});

// ============== SUBMISSION ENDPOINTS ==============

// Student: Submit answer for practical exam
router.post(
  "/submissions/submit",
  authenticate,
  upload.single("submission"),
  async (req, res) => {
    try {
      const { examId } = req.body;

      if (!examId || !req.file) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Exam ID and file are required",
        });
      }

      // Get student info
      const student = await findStudentForRequest(req.user);
      if (!student) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Student record not found",
        });
      }

      // Get exam info
      const exam = await PracticalExam.findById(examId);
      if (!exam) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Exam not found",
        });
      }

      // Check if student is allowed to submit for this exam
      if (!isStudentAllowedForExam(exam, student, req.user.college)) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          message: "You are not authorized to submit for this exam",
        });
      }

      const assignedQuestion = pickAssignedQuestion(exam, student);

      // Get file extension
      const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);

      // Check for existing submission and delete old file
      const existingSubmission = await PracticalExamSubmission.findOne({
        examId,
        studentId: student._id,
      });

      if (existingSubmission) {
        // Delete old file
        const oldFilePath = path.join(uploadsDir, existingSubmission.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        // Update existing submission
        existingSubmission.filePath = req.file.filename;
        existingSubmission.fileName = req.file.originalname;
        existingSubmission.fileType = fileExt;
        existingSubmission.fileSize = req.file.size;
        existingSubmission.submittedAt = Date.now();
        existingSubmission.assignedQuestionNumber = assignedQuestion?.questionNumber;
        existingSubmission.assignedQuestionText = assignedQuestion?.questionText;
        existingSubmission.assignedQuestionMarks = assignedQuestion?.marks;
        existingSubmission.assignedQuestionDifficulty = assignedQuestion?.difficulty;
        await existingSubmission.save();

        return res.json({
          success: true,
          message: "Submission updated successfully",
          submission: existingSubmission,
        });
      }

      // Create new submission
      const newSubmission = new PracticalExamSubmission({
        examId,
        studentId: student._id,
        studentName: student.studentName,
        studentRollNo: student.rollNo,
        division: student.division,
        batch: student.batch,
        filePath: req.file.filename,
        fileName: req.file.originalname,
        fileType: fileExt,
        fileSize: req.file.size,
        assignedQuestionNumber: assignedQuestion?.questionNumber,
        assignedQuestionText: assignedQuestion?.questionText,
        assignedQuestionMarks: assignedQuestion?.marks,
        assignedQuestionDifficulty: assignedQuestion?.difficulty,
        createdBy: exam.createdBy,
        owner: exam.owner,
        institution: req.user.college,
        college: req.user.college,
      });

      await newSubmission.save();

      res.status(201).json({
        success: true,
        message: "Submission uploaded successfully",
        submission: newSubmission,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error submitting exam:", error);
      res.status(500).json({
        success: false,
        message: "Error submitting exam",
        error: error.message,
      });
    }
  }
);

// Faculty: Get all submissions for an exam
router.get("/:examId/submissions", authenticate, async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify exam ownership
    const exam = await PracticalExam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (exam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all submissions for this exam
    const submissions = await PracticalExamSubmission.find({ examId }).sort({
      submittedAt: -1,
    });

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message,
    });
  }
});

// Faculty: Download/View submission file
router.get(
  "/submissions/:submissionId/download",
  authenticate,
  async (req, res) => {
    try {
      const { submissionId } = req.params;

      const submission = await PracticalExamSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      // Verify faculty ownership of the exam
      const exam = await PracticalExam.findById(submission.examId);
      if (exam.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const filePath = path.join(uploadsDir, submission.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Send file
      res.download(filePath, submission.fileName);
    } catch (error) {
      console.error("Error downloading submission:", error);
      res.status(500).json({
        success: false,
        message: "Error downloading submission",
        error: error.message,
      });
    }
  }
);

// Faculty: Get submission file as stream (for preview)
router.get(
  "/submissions/:submissionId/preview",
  authenticate,
  async (req, res) => {
    try {
      const { submissionId } = req.params;

      const submission = await PracticalExamSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      // Verify faculty ownership of the exam
      const exam = await PracticalExam.findById(submission.examId);
      if (exam.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const filePath = path.join(uploadsDir, submission.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Send file with appropriate content type
      const contentType =
        {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }[submission.fileType] || "application/octet-stream";

      res.type(contentType);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error("Error previewing submission:", error);
      res.status(500).json({
        success: false,
        message: "Error previewing submission",
        error: error.message,
      });
    }
  }
);

// Faculty: Update marks and feedback for submission
router.put("/submissions/:submissionId", authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission = await PracticalExamSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Verify faculty ownership of the exam
    const exam = await PracticalExam.findById(submission.examId);
    if (exam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (typeof marks === "number") {
      submission.marks = marks;
    }
    if (feedback) {
      submission.feedback = feedback;
    }

    submission.updatedAt = Date.now();
    await submission.save();

    res.json({
      success: true,
      message: "Submission updated successfully",
      submission,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({
      success: false,
      message: "Error updating submission",
      error: error.message,
    });
  }
});

// Faculty: Delete submission
router.delete("/submissions/:submissionId", authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await PracticalExamSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    // Verify faculty ownership of the exam
    const exam = await PracticalExam.findById(submission.examId);
    if (exam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete file
    const filePath = path.join(uploadsDir, submission.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await PracticalExamSubmission.findByIdAndDelete(submissionId);

    res.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting submission",
      error: error.message,
    });
  }
});

module.exports = router;
