const mongoose = require("mongoose");

const ctMarksSchema = new mongoose.Schema(
  {
    // CT Test info
    ctName: { type: String, required: true }, // e.g., "CT1", "CT2"
    ctNumber: { type: Number, required: true, enum: [1, 2] },

    // Student info
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: false },
    enrollmentNo: { type: String, required: false, trim: true },

    // Marks (CT is out of 30)
    marks: { type: Number, required: true, min: 0, max: 30 },
    totalMarks: { type: Number, default: 30 },

    // Context (to allow correct loading per CIANN/Course)
    program: { type: String, required: false },
    className: { type: String, required: false },
    course: { type: String, required: false },
    ciannId: { type: Number, required: true }, // Required for CT marks
    batch: { type: String, required: false },
    division: { type: String, required: false },

    // Additional fields for CT
    ctDate: { type: Date, required: false }, // When the CT was conducted
    subject: { type: String, required: false }, // Subject name
    subjectCode: { type: String, required: false }, // Subject code
    subjectId: { type: String, required: false },

    // Meta data
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    markedBy: { type: String, required: false }, // Teacher who marked
    remarks: { type: String, required: false }, // Any additional remarks
  },
  {
    timestamps: true,
  },
);

// Unique CT entry per CIANN + CT number + student enrollment number
ctMarksSchema.index(
  {
    ciannId: 1,
    ctNumber: 1,
    enrollmentNo: 1,
  },
  {
    unique: true,
    partialFilterExpression: { enrollmentNo: { $type: "string" } },
  },
);

ctMarksSchema.index({ ciannId: 1, ctNumber: 1 });
ctMarksSchema.index({ enrollmentNo: 1 });

module.exports = mongoose.model("CTMarks", ctMarksSchema);
