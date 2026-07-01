const mongoose = require("mongoose");

const ptConfigurationSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CiaanId: {
      type: Number,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    slaMarks: {
      type: Number,
      required: true,
    },
    components: [
      {
        componentName: {
          type: String,
          required: true,
          trim: true,
        },
        maxMarks: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Unique index: one configuration per subject per Ciaan per faculty
ptConfigurationSchema.index(
  { facultyId: 1, CiaanId: 1, subjectId: 1 },
  { unique: true }
);

module.exports = mongoose.model("PTConfiguration", ptConfigurationSchema);
