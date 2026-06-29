const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    college: { type: String, required: true },
    role: {
      type: String,
      enum: ["faculty", "student", "admin", "superadmin", "office", "hod", "academic_coordinator"],
      required: true,
    },
    ip: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
    message: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoginLog", LoginLogSchema);
