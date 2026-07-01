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
      default: "Notes",
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["file", "link", "rich-text"],
    },
    externalUrl: {
      type: String,
      trim: true,
      default: "",
    },
    richTextContent: {
      type: String,
      default: "",
    },
    thumbnailPath: {
      type: String,
      default: "",
    },
    academicYear: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    semester: {
      type: Number,
      default: 1,
    },
    chapterNo: {
      type: Number,
      default: 0,
    },
    chapterName: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
      index: true,
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

studyMaterialSchema.index({ institution: 1, courseId: 1, divisionId: 1, isActive: 1, isDraft: 1 });
studyMaterialSchema.index({ academicYear: 1, semester: 1, subject: 1 });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
