const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    scheme: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    institution: {
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
  },
);

CourseSchema.index({ institution: 1, courseCode: 1 }, { unique: true });

module.exports = mongoose.model("Course", CourseSchema);
