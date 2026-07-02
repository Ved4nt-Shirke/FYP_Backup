const mongoose = require("mongoose");

const EBookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    publicationName: {
      type: String,
      trim: true,
      default: "",
    },
    domains: {
      type: [String],
      default: [],
    },
    coverImagePath: {
      type: String,
      default: "",
    },
    filePath: {
      type: String,
      required: true,
    },
    mappings: [
      {
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
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
      },
    ],
    institution: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexing for search performance
EBookSchema.index({ title: "text", authors: "text", publicationName: "text" });

module.exports = mongoose.model("EBook", EBookSchema);
