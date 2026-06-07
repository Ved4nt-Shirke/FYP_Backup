// models/PracticalAttendance.js

const mongoose = require("mongoose");

const studentAttSchema = new mongoose.Schema({
  rollNo: String,
  studentName: String,
  status: { type: String, enum: ["Present", "Absent"], default: "Absent" },
});

const practicalAttendanceSchema = new mongoose.Schema(
  {
    ciannId: { type: Number, required: true },
    weekNo: { type: Number, required: true },
    batch: { type: String, required: true },
    exptNo: { type: String, required: true },
    exptName: { type: String, required: true },
    actualDate: { type: String, required: true }, // ISO date string
    remark: { type: String },
    students: [studentAttSchema],
  },
  { timestamps: true }
);

// Unique index to avoid duplicate entries per session
practicalAttendanceSchema.index(
  { ciannId: 1, weekNo: 1, batch: 1, exptNo: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.PracticalAttendance ||
  mongoose.model("PracticalAttendance", practicalAttendanceSchema);
