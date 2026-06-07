const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionText: { type: String, required: true },
  marks: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" }
});

const practicalExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    divisions: [{ type: String, required: true }], // Division names assigned to this exam
    batch: { type: String, required: true },
    isEnabled: { type: Boolean, default: true }, // Whether students can see this exam
    totalMarks: { type: Number, default: 100 },
    duration: { type: Number, default: 120 }, // in minutes
    questions: [questionSchema],
    createdBy: { type: String, required: true }, // Faculty name
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    institution: { type: String, required: true, uppercase: true }, // College name
    college: { type: String, required: true, uppercase: true }, // College identifier
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index for quick lookup by owner and batch
practicalExamSchema.index({ owner: 1, batch: 1 });
practicalExamSchema.index({ division: 1 });

module.exports = mongoose.model("PracticalExam", practicalExamSchema);
