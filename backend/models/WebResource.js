// models/WebResource.js

const mongoose = require("mongoose");

const webResourceSchema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true, enum: ['Website', 'Video', 'Tutorial', 'Documentation', 'Blog', 'Journal', 'Other'] },
    description: { type: String },
    author: { type: String },
    publishedDate: { type: Date },
    accessType: { type: String, enum: ['Free', 'Paid', 'Subscription', 'Registration Required'], default: 'Free' },
    language: { type: String, default: 'English' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    moduleMapping: [{ type: String }], // Which course modules this resource covers
    tags: [{ type: String }],
    rating: { type: Number, min: 0, max: 5 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for efficient queries
webResourceSchema.index({ CiaanId: 1 });
webResourceSchema.index({ type: 1 });

module.exports =
  mongoose.models.WebResource ||
  mongoose.model("WebResource", webResourceSchema);