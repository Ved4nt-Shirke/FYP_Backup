const mongoose = require("mongoose");

const mockExamQuestionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["MCQ", "THEORY"],
      required: true,
    },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: { type: String, default: "" },
    marks: { type: Number, default: 0, min: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: true },
);

const mockExamSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true, trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
      index: true,
    },
    semester: { type: Number, required: true, min: 1, max: 8, index: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 0 },
    examType: {
      type: String,
      enum: ["MCQ", "THEORY", "MIXED"],
      default: "MIXED",
    },
    questions: {
      type: [mockExamQuestionSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPublished: { type: Boolean, default: false },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    negativeMarking: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

mockExamSchema.index({ courseId: 1, divisionId: 1, semester: 1, subjectId: 1 });

module.exports = mongoose.model("MockExam", mockExamSchema);