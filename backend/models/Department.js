const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  institution: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

DepartmentSchema.index({ institution: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Department", DepartmentSchema);
