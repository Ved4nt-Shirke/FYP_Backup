const mongoose = require("mongoose");

const saPrK4Schema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    courseCode: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    division: { type: String, required: true, trim: true },
    examDate: { type: Date },
    maxMarks: { type: Number, required: true },
    minMarks: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ownerUsername: { type: String, trim: true },
    students: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        rollNo: { type: String, trim: true },
        enrollmentNo: { type: String, trim: true },
        studentName: { type: String, trim: true },
        seatNo: { type: String, trim: true },
        marks: { type: Number },
      },
    ],
  },
  { timestamps: true },
);

saPrK4Schema.index({ CiaanId: 1, division: 1 }, { unique: true });

module.exports = mongoose.model("SaPrK4", saPrK4Schema);
