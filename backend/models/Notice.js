const mongoose = require("mongoose");

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ["faculty", "office"],
    default: "faculty",
  },
  division: {
    type: String,
    required: false,
  },
  college: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notice", NoticeSchema);
