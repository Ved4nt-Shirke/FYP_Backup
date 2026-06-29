const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  enrollmentNo: { type: String, required: true },
  studentName: { type: String, required: true },
  batch: { type: String, required: true },
  academicYear: { type: String, default: "" },

  // Old text-based division (kept for backward compatibility)
  division: { type: String, default: "" },

  // New references to Admin Panel entities
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },
  divisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division"
  },
  institution: {
    type: String,
    required: true,
    trim: true,
  },

  username: { type: String },
  password: { type: String }, // Hashed password
  plainPassword: { type: String }, // Plain password for display (set once during import)
  passwordGeneratedAt: { type: Date }, // Track when password was generated
  aadhaarNo: { type: String, default: '' }, // Encrypted Aadhaar card number
  aadhaarLastFour: { type: String, default: '' }, // Last 4 digits for masked display
  seatNo: { type: String, default: "" }, // Exam seat number
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
});

studentSchema.index({ institution: 1, departmentId: 1, divisionId: 1 });

module.exports = mongoose.model("Student", studentSchema);
