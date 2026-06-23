const mongoose = require("mongoose");

const AcademicYearSchema = new mongoose.Schema(
  {
    yearName: {
      type: String,
      required: true,
      trim: true,
    },
    scheme: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup for the active year per institution
AcademicYearSchema.index({ college: 1, status: 1 });

// Prevent duplicate year names per institution
AcademicYearSchema.index({ college: 1, yearName: 1 }, { unique: true });

module.exports = mongoose.model("AcademicYear", AcademicYearSchema);
