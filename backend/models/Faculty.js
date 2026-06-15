const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },

  // WhatsApp number for attendance bot (with country code, e.g. 919876543210)
  whatsappPhone: {
    type: String,
    trim: true,
    default: "",
  },

  // Professional Information
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  institution: {
    type: String,
    required: true,
    trim: true,
  },

  // Skills
  skills: [
    {
      type: String,
      trim: true,
    },
  ],

  // Login Credentials (generated)
  generatedUsername: {
    type: String,
    trim: true,
  },
  currentPassword: {
    type: String,
    trim: true,
  },

  // System Information
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  role: {
    type: String,
    enum: ["faculty", "hod", "academic_coordinator"],
    default: "faculty",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
FacultySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
FacultySchema.index({ institution: 1, department: 1 });
FacultySchema.index({ status: 1 });

module.exports = mongoose.model("Faculty", FacultySchema);
