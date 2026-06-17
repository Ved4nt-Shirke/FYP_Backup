const mongoose = require("mongoose");

const VisionMissionSchema = new mongoose.Schema(
  {
    institutionCode: {
      type: String,
      required: true,
      trim: true,
    },
    // If departmentId is null, it applies to the entire Institution
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    vision: {
      type: String,
      required: true,
      trim: true,
    },
    mission: {
      type: [String],
      default: [],
    },
    peos: {
      type: [String],
      default: [],
    },
    pos: [
      {
        code: { type: String, required: true }, // e.g., "PO 1", "PO 2"
        name: { type: String, required: true }, // e.g., "Problem analysis"
        description: { type: String, required: true }, // e.g., "Identify and analyse..."
      },
    ],
    psos: [
      {
        code: { type: String, required: true }, // e.g., "PSO 1", "PSO 2"
        name: { type: String, required: true }, // e.g., "Computer Software..."
        description: { type: String, required: true }, // e.g., "Use state-of-the-art..."
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique configuration per department or globally for the institution
VisionMissionSchema.index(
  { institutionCode: 1, departmentId: 1 },
  { unique: true }
);

module.exports = mongoose.model("VisionMission", VisionMissionSchema);
