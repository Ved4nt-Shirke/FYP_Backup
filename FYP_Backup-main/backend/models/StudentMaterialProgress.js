const mongoose = require("mongoose");

const studentMaterialProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    videoProgress: {
      playedSeconds: {
        type: Number,
        default: 0,
      },
      playedPercentage: {
        type: Number,
        default: 0,
      },
      lastWatchedAt: {
        type: Date,
      },
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentMaterialProgressSchema.index({ studentId: 1, materialId: 1 }, { unique: true });

module.exports = mongoose.model("StudentMaterialProgress", studentMaterialProgressSchema);
