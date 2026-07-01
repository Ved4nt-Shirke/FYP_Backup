const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
  },
  institution: {
    type: String,
    required: true,
    uppercase: true,
  },
  description: {
    type: String,
    default: "",
  },
  createdBy: {
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
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Compound unique index on institution and code
BranchSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Branch", BranchSchema);
