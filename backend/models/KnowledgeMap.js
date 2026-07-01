// models/KnowledgeMap.js

const mongoose = require("mongoose");

const knowledgeMapSchema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    moduleNumber: { type: String, required: true }, // Module 1, Module 2, etc.
    moduleName: { type: String, required: true },
    topics: [{
      topicName: { type: String, required: true },
      subtopics: [{ type: String }],
      learningHours: { type: Number },
      difficulty: { type: String, enum: ['Basic', 'Intermediate', 'Advanced'] },
      prerequisites: [{ type: String }],
      learningOutcomes: [{ type: String }]
    }],
    totalHours: { type: Number },
    assessmentWeightage: { type: Number, min: 0, max: 100 },
    relatedCOs: [{ type: String }], // Related Course Outcomes
    resources: [{
      type: { type: String, enum: ['Book', 'Website', 'Video', 'Document'] },
      title: { type: String },
      reference: { type: String }
    }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for unique modules per Ciaan
knowledgeMapSchema.index({ CiaanId: 1, moduleNumber: 1 }, { unique: true });

module.exports =
  mongoose.models.KnowledgeMap ||
  mongoose.model("KnowledgeMap", knowledgeMapSchema);