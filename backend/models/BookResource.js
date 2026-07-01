// models/BookResource.js

const mongoose = require("mongoose");

const bookResourceSchema = new mongoose.Schema(
  {
    CiaanId: { type: Number, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['Textbook', 'Reference Book', 'E-book', 'Journal', 'Other'] },
    author: { type: String, required: true },
    publisher: { type: String, required: true },
    edition: { type: String },
    module: { type: String },
    isbn: { type: String },
    year: { type: Number },
    pages: { type: String },
    availability: { type: String, enum: ['Library', 'Online', 'Purchase Required', 'Free Access'], default: 'Library' }
  },
  { timestamps: true }
);

// Index for efficient queries
bookResourceSchema.index({ CiaanId: 1 });

module.exports =
  mongoose.models.BookResource ||
  mongoose.model("BookResource", bookResourceSchema);