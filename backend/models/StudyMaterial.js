const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    subject: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Notes",
        "Assignment",
        "Question Bank",
        "Lab Manual",
        "Reference",
        "Presentation",
        "Other",
      ],
      default: "Notes",
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["file", "link"],
    },
    externalUrl: {
      type: String,
      trim: true,
      default: "",
    },
    fileName: {
      type: String,
      trim: true,
      default: "",
    },
    filePath: {
      type: String,
      trim: true,
      default: "",
    },
    fileMimeType: {
      type: String,
      trim: true,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
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
    institution: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

studyMaterialSchema.index({ institution: 1, courseId: 1, divisionId: 1, isActive: 1 });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
