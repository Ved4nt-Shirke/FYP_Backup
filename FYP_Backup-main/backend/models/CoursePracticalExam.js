const mongoose = require("mongoose");

const CoursePracticalExamSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    // Array to store references to all practical exams created by faculty for this course
    practicalExamLinks: [
      {
        examId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PracticalExam",
        },
        title: String,
        facultyName: String,
        facultyId: mongoose.Schema.Types.ObjectId,
        division: String,
        publicLink: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

CoursePracticalExamSchema.index(
  { courseId: 1, institution: 1 },
  { unique: true },
);
CoursePracticalExamSchema.index({ departmentId: 1 });

module.exports = mongoose.model(
  "CoursePracticalExam",
  CoursePracticalExamSchema,
);
