const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  institutionCode: {
    type: String,
    required: true,
    ref: "Institution"
  },
  courseId: {
    type: String,
    required: true,
    unique: true
  },
  courseName: {
    type: String,
    required: true
  },
  abbreviation: {
    type: String,
    required: false
  },
  department: {
    type: String,
    required: false,
    enum: ["CO", "IF", "EJ", ""]
  },
  courseNumbers: [
    {
      number: {
        type: String,
        required: false
      },
      branch: {
        type: String,
        required: false
      },
      semester: {
        type: Number,
        required: false
      }
    }
  ],
  credits: {
    type: Number,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleteable: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    required: true,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique course per institution
CourseSchema.index({ institutionCode: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Course", CourseSchema);
