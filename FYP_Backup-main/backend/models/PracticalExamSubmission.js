const mongoose = require("mongoose");

const practicalExamSubmissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PracticalExam",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentName: { type: String, required: true },
    studentRollNo: { type: String, required: true },
    division: { type: String, required: true },
    batch: { type: String, required: true },
    filePath: { type: String, required: true }, // Path to uploaded file
    fileName: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx"],
      required: true,
    }, // File extension
    fileSize: { type: Number }, // File size in bytes
    submittedAt: { type: Date, default: Date.now },
    marks: { type: Number, default: null }, // Faculty can assign marks
    feedback: { type: String, default: "" }, // Faculty feedback
    assignedQuestionNumber: { type: Number, default: null },
    assignedQuestionText: { type: String, default: "" },
    assignedQuestionMarks: { type: Number, default: null },
    assignedQuestionDifficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", ""],
      default: "",
    },
    createdBy: { type: String, required: true }, // Faculty name who created the exam
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // Faculty who owns the exam
    institution: { type: String, required: true, uppercase: true },
    college: { type: String, required: true, uppercase: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for quick lookup
practicalExamSubmissionSchema.index({ examId: 1, studentId: 1 });
practicalExamSubmissionSchema.index({ owner: 1, examId: 1 });

module.exports = mongoose.model(
  "PracticalExamSubmission",
  practicalExamSubmissionSchema
);
