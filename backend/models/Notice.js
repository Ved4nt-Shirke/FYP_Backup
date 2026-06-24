const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ["faculty", "office"],
    default: "faculty",
  },
  college: {
    type: String,
    required: true,
  },
  
  // Notice Types
  noticeType: {
    type: String,
    enum: [
      "general",
      "urgent",
      "exam",
      "fee",
      "event",
      "holiday",
      "scholarship",
      "circular"
    ],
    default: "general",
  },

  // Notice Target Options
  targetType: {
    type: String,
    enum: [
      "all",
      "all-faculty",
      "all-students",
      "particular-faculty",
      "particular-student",
      "departments",
      "divisions",
      "academic-year"
    ],
    default: "all",
  },
  targetFaculties: [{
    type: String, // usernames of the targeted faculty members
  }],
  targetStudents: [{
    type: String, // usernames/enrollment numbers of the targeted students
  }],
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  }],
  targetDivisions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Division",
  }],
  targetAcademicYears: [{
    type: String, // e.g. "2025-26"
  }],
  
  // Attachments Support
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
  }],
  
  // Schedule & Expiry
  scheduledAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  
  // Read Status Tracking
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    readAt: {
      type: Date,
      default: Date.now,
    }
  }],

  // Keep original division string for backward compatibility
  division: {
    type: String,
    required: false,
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

module.exports = mongoose.model("Notice", NoticeSchema);

