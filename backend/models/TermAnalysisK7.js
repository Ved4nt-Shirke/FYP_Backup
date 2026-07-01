const mongoose = require("mongoose");

const passingHeadStatsSchema = new mongoose.Schema({
  passingHead: { type: String, required: true }, // "FA-TH", "SA-TH", "FA-PR", "SA-PR", "SLA"
  lowestMarks: { type: Number, default: 0 },
  highestMarks: { type: Number, default: 0 },
  appearedStudents: { type: Number, default: 0 },
  passedStudents: { type: Number, default: 0 },
  above60Percentage: { type: Number, default: 0 },
});

const TermAnalysisK7Schema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    instituteName: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    programme: { type: String, trim: true },
    division: { type: String, trim: true },
    semester: { type: String, trim: true },
    examType: { type: String, trim: true }, // e.g. "Winter 2023" or "Summer 2024"
    courseCode: { type: String, trim: true },
    courseName: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerUsername: { type: String, trim: true },
    heads: [passingHeadStatsSchema],
  },
  { timestamps: true }
);

// We index by CiaanId and owner so that a faculty can create term analysis for their own Ciaan
TermAnalysisK7Schema.index({ CiaanId: 1 }, { unique: true });

module.exports = mongoose.model("TermAnalysisK7", TermAnalysisK7Schema);
