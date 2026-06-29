const mongoose = require("mongoose");

const CiannCollaborationLogSchema = new mongoose.Schema(
  {
    ciannId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ciann",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["created", "updated", "deleted"],
    },
    details: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

CiannCollaborationLogSchema.index({ ciannId: 1, timestamp: -1 });

module.exports = mongoose.model("CiannCollaborationLog", CiannCollaborationLogSchema);
