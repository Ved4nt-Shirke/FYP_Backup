// models/CourseOutcome.js

const mongoose = require("mongoose");

const courseOutcomeSchema = new mongoose.Schema(
  {
    ciannId: { type: Number, required: true },
    outcomeNumber: { type: String, required: true }, // CO1, CO2, etc.
    description: { type: String, required: true },
    bloomsLevel: { type: String, enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
    weightage: { type: Number, min: 0, max: 100 },
    assessmentMethods: [{ type: String }], // ['Quiz', 'Assignment', 'Project', 'Exam']
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for unique outcomes per CIANN
courseOutcomeSchema.index({ ciannId: 1, outcomeNumber: 1 }, { unique: true });

module.exports =
  mongoose.models.CourseOutcome ||
  mongoose.model("CourseOutcome", courseOutcomeSchema);