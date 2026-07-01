const mongoose = require("mongoose");

const studentPTMarksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CiaanId: {
      type: Number,
      required: true,
    },
    marks: [
      {
        componentName: {
          type: String,
          required: true,
          trim: true,
        },
        obtainedMarks: {
          type: Number,
          required: true,
          min: 0,
        },
        maxMarks: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one mark entry per student per subject per Ciaan
studentPTMarksSchema.index(
  { studentId: 1, subjectId: 1, CiaanId: 1 },
  { unique: true }
);

module.exports = mongoose.model("StudentPTMarks", studentPTMarksSchema);
