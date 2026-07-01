// models/LabPlanning.js
const mongoose = require('mongoose');

const labPlanEntrySchema = new mongoose.Schema({
  co: { type: String, default: "" },
  llo: { type: String, default: "" },
  batch: { type: String, required: true },
  exptNo: { type: String, required: true },
  exptName: { type: String, required: true },
  date: { type: String, required: true },
  actualDate: { type: String, default: '' },
  remark: { type: String, default: '' }
});

const labPlanningSchema = new mongoose.Schema({
  CiaanId: { type: Number, required: true },
  weekNo: { type: Number, required: true },
  plans: [labPlanEntrySchema]
});

// Create a compound index to ensure weekNo is unique PER CiaanId
labPlanningSchema.index({ CiaanId: 1, weekNo: 1 }, { unique: true });

// Prevent OverwriteModelError
module.exports = mongoose.models.LabPlanning || mongoose.model('LabPlanning', labPlanningSchema);