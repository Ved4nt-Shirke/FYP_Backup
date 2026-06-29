const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["faculty", "student", "admin", "superadmin", "office"],
      required: true,
    },
    username: { type: String, default: "" },
  },
  { _id: false },
);

const chatConversationSchema = new mongoose.Schema(
  {
    institutionCode: { type: String, required: true, index: true },
    participants: { type: [participantSchema], default: [] },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    facultyName: { type: String, default: "" },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, default: "" },

    departmentName: { type: String, default: "" },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSenderRole: { type: String, default: "" },

    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

chatConversationSchema.index(
  { institutionCode: 1, facultyId: 1, studentId: 1 },
  { unique: true },
);

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
