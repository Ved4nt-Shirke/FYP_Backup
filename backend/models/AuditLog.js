const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "CREATE_INSTITUTION",
      "UPDATE_INSTITUTION_ADMIN",
      "DELETE_INSTITUTION",
      "UPDATE_SUPERADMIN_CREDENTIALS",
    ],
  },
  resourceId: {
    type: String, // ID of the affected resource
    required: false,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
