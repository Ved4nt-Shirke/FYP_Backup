const mongoose = require("mongoose");

const studentTimetableSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: "Class Timetable",
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    divisionName: {
      type: String,
      required: true,
      trim: true,
    },
    semesterEndDate: {
      type: Date,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
      trim: true,
    },
    fileMimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

studentTimetableSchema.index({ institution: 1, divisionId: 1, isActive: 1 });

module.exports = mongoose.model("StudentTimetable", studentTimetableSchema);
