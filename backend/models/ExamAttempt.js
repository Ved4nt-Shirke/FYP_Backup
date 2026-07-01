const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answer: { type: String, default: "" },
    marksAwarded: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockExam",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    timeTaken: { type: Number, default: 0 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["submitted", "auto-submitted"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
  },
);

examAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);