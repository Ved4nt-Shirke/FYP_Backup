const mongoose = require('mongoose');

const tutorialPlanEntrySchema = new mongoose.Schema({
  chapter: { type: String, required: true },
  subTopic: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  teachingMethod: { type: String },
  actualDate: { type: String, default: '' },
  remark: { type: String, default: '' }
}, { _id: false });

const tutorialPlanSchema = new mongoose.Schema({
  CiaanId: { type: Number, required: true, index: true },
  weekNo: { type: Number, required: true },
  plans: [tutorialPlanEntrySchema]
});

// Compound index to ensure uniqueness of weekNo per CiaanId
tutorialPlanSchema.index({ CiaanId: 1, weekNo: 1 }, { unique: true });

module.exports = mongoose.models.TutorialPlan || mongoose.model('TutorialPlan', tutorialPlanSchema);
