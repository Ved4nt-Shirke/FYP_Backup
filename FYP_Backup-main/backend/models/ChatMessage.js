const mongoose = require("mongoose");

const seenBySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seenAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    name: { type: String, default: "" },
    mimeType: { type: String, default: "" },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
      index: true,
    },
    institutionCode: { type: String, required: true, index: true },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ["faculty", "student", "admin", "superadmin", "office"],
      required: true,
    },
    senderName: { type: String, default: "" },

    body: { type: String, required: true, trim: true, maxlength: 4000 },
    attachment: { type: attachmentSchema, default: null },

    deliveredAt: { type: Date, default: Date.now },
    seenBy: { type: [seenBySchema], default: [] },
  },
  { timestamps: true },
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
