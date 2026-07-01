// models/SubjectObjective.js

const mongoose = require("mongoose");

const subjectObjectiveSchema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    objectiveNumber: { type: String, required: true }, // OBJ1, OBJ2, etc.
    description: { type: String, required: true },
    category: { type: String, enum: ['Knowledge', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation'] },
    relatedCOs: [{ type: String }], // Related Course Outcomes
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for unique objectives per Ciaan
subjectObjectiveSchema.index({ CiaanId: 1, objectiveNumber: 1 }, { unique: true });

module.exports =
  mongoose.models.SubjectObjective ||
  mongoose.model("SubjectObjective", subjectObjectiveSchema);