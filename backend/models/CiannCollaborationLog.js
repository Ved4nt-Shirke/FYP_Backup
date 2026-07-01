const mongoose = require("mongoose");

const CiaanCollaborationLogSchema = new mongoose.Schema(
  {
    CiaanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ciaan",
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

CiaanCollaborationLogSchema.index({ CiaanId: 1, timestamp: -1 });

module.exports = mongoose.model("CiaanCollaborationLog", CiaanCollaborationLogSchema);
