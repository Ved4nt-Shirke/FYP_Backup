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
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    correctAnswer: { type: String, default: "" },
    marks: { type: Number, default: 0, min: 0 },
    explanation: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
    },
    chapter: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
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
    attemptsAllowed: {
      type: String,
      enum: ["SINGLE", "MULTIPLE"],
      default: "SINGLE",
    },
    maxAttempts: { type: Number, default: 1, min: 1 },
    resumeEnabled: { type: Boolean, default: true },
    passingMarks: { type: Number, default: 18, min: 0 },
    timerPerQuestion: { type: Boolean, default: false },
    timerPerQuestionDuration: { type: Number, default: 0, min: 0 }, // in seconds
    fullscreenRequired: { type: Boolean, default: false },
    preventTabSwitch: { type: Boolean, default: false },
    sections: {
      type: Array,
      default: [], // array of objects { title, startIdx, endIdx }
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

mockExamSchema.index({ courseId: 1, divisionId: 1, semester: 1, subjectId: 1 });

module.exports = mongoose.model("MockExam", mockExamSchema);