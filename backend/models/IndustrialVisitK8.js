const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
  srNo: Number,
  dateOfVisit: Date,
  yearSemester: String,
  industryName: String,
  coordinatorName: String,
  beneficiaries: String,
  relevanceToCourse: String,
  mappingWithPO: String,
});

const IndustrialVisitK8Schema = new mongoose.Schema(
  {
    ciannId: { type: Number },
    instituteName: { type: String, default: "" },
    academicYear: { type: String, default: "" },
    programme: { type: String, default: "" },
    division: { type: String, default: "" },
    entries: { type: [EntrySchema], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("IndustrialVisitK8", IndustrialVisitK8Schema);
