// models/MoocCourse.js

const mongoose = require("mongoose");

const moocCourseSchema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    conductedBy: { type: String, required: true }, // Platform name like Coursera, edX, etc.
    duration: { type: String, required: true }, // e.g., "6 weeks", "40 hours"
    certificate: { type: String, enum: ['Free', 'Paid', 'Audit Only', 'Not Available'], default: 'Free' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    language: { type: String, default: 'English' },
    rating: { type: Number, min: 0, max: 5 },
    enrollmentCount: { type: Number },
    isRecommended: { type: Boolean, default: true },
    moduleMapping: [{ type: String }], // Which course modules this MOOC covers
    description: { type: String }
  },
  { timestamps: true }
);

// Index for efficient queries
moocCourseSchema.index({ CiaanId: 1 });
moocCourseSchema.index({ conductedBy: 1 });

module.exports =
  mongoose.models.MoocCourse ||
  mongoose.model("MoocCourse", moocCourseSchema);