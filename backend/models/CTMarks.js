const mongoose = require('mongoose');

const ctMarksSchema = new mongoose.Schema({
  // CT Test info
  ctName: { type: String, required: true }, // e.g., "CT1", "CT2", "Mid-term", etc.
  ctNumber: { type: Number, required: true }, // 1, 2, 3, etc.

  // Student info
  studentName: { type: String, required: true },
  rollNo: { type: String, required: false },

  // Marks (typically out of 20 for CT)
  marks: { type: Number, required: true, min: 0, max: 20 },
  totalMarks: { type: Number, default: 20 }, // Maximum marks for the CT

  // Context (to allow correct loading per CIANN/Course)
  program: { type: String, required: false },
  className: { type: String, required: false },
  course: { type: String, required: false },
  ciannId: { type: Number, required: true }, // Required for CT marks
  batch: { type: String, required: false },
  division: { type: String, required: false },

  // Additional fields for CT
  ctDate: { type: Date, required: false }, // When the CT was conducted
  subject: { type: String, required: false }, // Subject name
  subjectCode: { type: String, required: false }, // Subject code

  // Meta data
  markedBy: { type: String, required: false }, // Teacher who marked
  remarks: { type: String, required: false } // Any additional remarks
}, {
  timestamps: true
});

// Create unique index for CT per student per CIANN
ctMarksSchema.index({ 
  ctNumber: 1, 
  studentName: 1,
  ciannId: 1 
}, { unique: true });

module.exports = mongoose.model('CTMarks', ctMarksSchema);