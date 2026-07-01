const mongoose = require("mongoose");

const ClassroomSchema = new mongoose.Schema({
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
ClassroomSchema.index({ institution: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Classroom", ClassroomSchema);
