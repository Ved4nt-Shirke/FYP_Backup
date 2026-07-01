const mongoose = require('mongoose');

const ptMicroProjectSchema = new mongoose.Schema({
  // Student info
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },

  // Activity type
  activityType: {
    type: String,
    enum: ['Microproject', 'Assignment', 'Other Activity', 'CIAAN'],
    required: true
  },

  // Marks (0 to maxMarks)
  marks: {
    type: Number,
    required: true,
    min: 0
  },

  // Maximum marks out of which marks are given
  maxMarks: {
    type: Number,
    required: true,
    enum: [5, 10, 15, 20, 25]
  },

  // Faculty who entered the marks
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Course and class info for context
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  activityIndex: {
    type: Number,
    min: 1,
    default: 1
  },
  CiaanId: {
    type: Number
  },
  subjectId: {
    type: String,
    trim: true
  },
  subjectName: {
    type: String,
    trim: true
  },
  divisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division'
  },
  batch: {
    type: String
  },
  institution: {
    type: String,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['Submitted', 'Evaluated'],
    default: 'Evaluated'
  },

  // Feedback (optional)
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Unique index: one mark entry per student per activity type per Ciaan
ptMicroProjectSchema.index({
  studentId: 1,
  activityType: 1,
  CiaanId: 1,
  institution: 1
}, { unique: true });

module.exports = mongoose.model('PTMicroProject', ptMicroProjectSchema);
