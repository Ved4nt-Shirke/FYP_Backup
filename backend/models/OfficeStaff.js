const mongoose = require("mongoose");

const OfficeStaffSchema = new mongoose.Schema(
  {
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

    // Login Credentials (generated)
    generatedUsername: {
      type: String,
      trim: true,
    },
    currentPassword: {
      type: String,
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // System Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OfficeStaff", OfficeStaffSchema);
