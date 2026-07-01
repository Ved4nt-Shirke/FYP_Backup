const mongoose = require('mongoose');

const teachingPlanEntrySchema = new mongoose.Schema({
  co: { type: String, default: "" },
  tlo: { type: String, default: "" },
  chapter: { type: String, required: true },
  subTopic: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  teachingMethod: { type: String, required: true }
}, { _id: false }); // Good practice to disable _id for subdocuments if not needed.

const teachingPlanSchema = new mongoose.Schema({
  CiaanId: { type: Number, required: true, index: true },
  weekNo: { type: Number, required: true },
  plans: [teachingPlanEntrySchema]
});

// FIX: Create a compound index to ensure weekNo is unique PER CiaanId.
// This is the key change to prevent the duplicate key error for different courses.
teachingPlanSchema.index({ CiaanId: 1, weekNo: 1 }, { unique: true });

// Prevent OverwriteModelError
module.exports = mongoose.models.TeachingPlan || mongoose.model('TeachingPlan', teachingPlanSchema);
