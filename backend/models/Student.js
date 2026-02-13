const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  enrollmentNo: { type: String, required: true },
  studentName: { type: String, required: true },
  batch: { type: String, required: true },
  division: { type: String, default: "" },
  username: { type: String },
  plainPassword: { type: String },
});

module.exports = mongoose.model("Student", studentSchema);
