const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  // Experiment info
  experimentName: { type: String, required: true },
  experimentNumber: { type: Number, required: true },

  // Student info
  studentName: { type: String, required: true },
  rollNo: { type: String, required: false },

  // Marks
  marks: { type: Number, required: true, min: 0, max: 25 },

  // Context (to allow correct loading in defaulter/studentwise flows)
  program: { type: String, required: false },
  className: { type: String, required: false },
  course: { type: String, required: false },
  ciannId: { type: Number, required: false },
  batch: { type: String, required: false }
}, {
  timestamps: true
});

// NOTE: Keeping existing unique index to avoid migration side-effects.
// If you need per-course uniqueness, create a migration to replace this with
// { experimentNumber: 1, studentName: 1, course: 1 } unique index.
assessmentSchema.index({ 
  experimentNumber: 1, 
  studentName: 1 
}, { unique: true });

module.exports = mongoose.model('Assessment', assessmentSchema);