const mongoose = require("mongoose");

const K9EntrySchema = new mongoose.Schema({
  srNo: Number,
  expertDetails: { type: String, default: "" }, // Name, Designation, Organisation of Expert Along with Contact Details & Email ID
  dateOfExpertLecture: { type: Date }, // Date of Expert Lecture
  topic: { type: String, default: "" }, // Topic
  yearSemester: { type: String, default: "" }, // Year / Semester
  coordinatorName: { type: String, default: "" }, // Name of Coordinator
  studentsAttended: { type: String, default: "" }, // No. of Students Attended
  relevanceToPO: { type: String, default: "" }, // Relevance to PO's & PSO (only nos.)
});

const ExpertLectureK9Schema = new mongoose.Schema(
  {
    ciannId: { type: Number },
    instituteName: { type: String, default: "" },
    academicYear: { type: String, default: "" },
    programme: { type: String, default: "" },
    division: { type: String, default: "" },
    entries: { type: [K9EntrySchema], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ExpertLectureK9", ExpertLectureK9Schema);

