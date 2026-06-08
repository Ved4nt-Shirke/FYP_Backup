const mongoose = require("mongoose");

const tloLloSchema = new mongoose.Schema(
  {
    ciannId: {
      type: Number,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coData: [
      {
        coNumber: {
          type: String,
          required: true,
        },
        coDescription: {
          type: String,
          default: "",
        },
        tlos: [
          {
            type: String,
            trim: true,
          },
        ],
        llos: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Unique index: one document per faculty, ciann, and subject
tloLloSchema.index({ facultyId: 1, ciannId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model("TloLlo", tloLloSchema);
