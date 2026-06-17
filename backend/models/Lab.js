const mongoose = require("mongoose");

const LabSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  institution: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index on institution and name
LabSchema.index({ institution: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Lab", LabSchema);
