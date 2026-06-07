const mongoose = require("mongoose");

const CourseDetailsSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      unique: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    courseCode: {
      type: String,
      trim: true,
      default: "",
    },
    courseTitle: {
      type: String,
      trim: true,
      default: "",
    },
    abbreviation: {
      type: String,
      trim: true,
      default: "",
    },
    courseCategory: {
      type: String,
      trim: true,
      default: "",
    },
    credits: {
      type: Number,
      default: 0,
    },
    paperDuration: {
      type: String,
      trim: true,
      default: "",
    },

    learningScheme: {
      cl: { type: String, default: "-" },
      tl: { type: String, default: "-" },
      ll: { type: String, default: "-" },
      slh: { type: String, default: "-" },
      nlh: { type: String, default: "-" },
    },

    assessmentScheme: {
      theory: {
        faThMax: { type: String, default: "-" },
        saThMax: { type: String, default: "-" },
        total: { type: String, default: "-" },
        min: { type: String, default: "-" },
      },
      practical: {
        faPrMax: { type: String, default: "-" },
        faPrMin: { type: String, default: "-" },
        saPrMax: { type: String, default: "-" },
        saPrMin: { type: String, default: "-" },
      },
      sla: {
        max: { type: String, default: "-" },
        min: { type: String, default: "-" },
      },
      totalMarks: { type: String, default: "-" },
    },

    courseOutcomes: [
      {
        coNumber: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CourseDetails", CourseDetailsSchema);
