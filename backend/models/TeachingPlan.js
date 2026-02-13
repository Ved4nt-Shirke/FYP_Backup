const mongoose = require('mongoose');

const teachingPlanEntrySchema = new mongoose.Schema({
  chapter: { type: String, required: true },
  subTopic: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  teachingMethod: { type: String, required: true }
}, {_id: false}); // Good practice to disable _id for subdocuments if not needed.

const teachingPlanSchema = new mongoose.Schema({
  ciannId: { type: Number, required: true, index: true },
  weekNo: { type: Number, required: true },
  plans: [teachingPlanEntrySchema]
});

// FIX: Create a compound index to ensure weekNo is unique PER ciannId.
// This is the key change to prevent the duplicate key error for different courses.
teachingPlanSchema.index({ ciannId: 1, weekNo: 1 }, { unique: true });

// Prevent OverwriteModelError
module.exports = mongoose.models.TeachingPlan || mongoose.model('TeachingPlan', teachingPlanSchema);
