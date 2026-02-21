const mongoose = require("mongoose");

const InstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  adminUsername: {
    type: String,
    required: true,
    unique: true,
  },
  adminPassword: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
    default: "",
  },
  logoMimeType: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Theme/Color Palette per-institution (applies to Admin UI initially)
  palette: {
    name: { type: String, default: "emerald" },
    colors: {
      primary: { type: String, default: "#10b981" },
      primaryLight: { type: String, default: "#ecfdf5" },
      background: { type: String, default: "#f9fafb" },
      surface: { type: String, default: "#ffffff" },
      border: { type: String, default: "#e5e7eb" },
      text: { type: String, default: "#111827" },
      textMuted: { type: String, default: "#6b7280" },
      accent: { type: String, default: "#f59e0b" },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Institution", InstitutionSchema);
