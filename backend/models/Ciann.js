const mongoose = require("mongoose");

const CiannSchema = new mongoose.Schema(
  {
    ciannId: {
      type: Number,
      required: true,
      unique: true,
      min: 1000,
      max: 9999,
    },
    department: { type: Object, required: true },
    division: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    subject: { type: Object, required: true },
    semester: { type: String, required: true, trim: true },
    semesterType: { type: String, trim: true },
    college: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerUsername: { type: String, required: true, trim: true },
    ownerRole: {
      type: String,
      enum: ["faculty", "admin", "superadmin", "office"],
      required: true,
    },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  },
  {
    timestamps: true,
  }
);

CiannSchema.index({ owner: 1, ciannId: 1 });
CiannSchema.index({ college: 1, ciannId: 1 });

module.exports = mongoose.model("Ciann", CiannSchema);
