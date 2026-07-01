const mongoose = require("mongoose");

const StudentAcademicHistorySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    seatNo: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      required: true,
    },
    promotedAt: {
      type: Date,
      default: Date.now,
    },
    promotedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: a student can have only one record per academic year + semester combo
StudentAcademicHistorySchema.index({ studentId: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model("StudentAcademicHistory", StudentAcademicHistorySchema);
