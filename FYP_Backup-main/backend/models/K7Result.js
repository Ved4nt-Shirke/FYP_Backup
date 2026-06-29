const mongoose = require("mongoose");

const k7ResultSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    semester: { type: String, required: true },
    examType: { type: String, required: false }, // "Summer" or "Winter"
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    divisionId: { type: mongoose.Schema.Types.ObjectId, ref: "Division", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    
    // Configurations of max marks per course/passing head
    courseConfigs: [
      {
        courseCode: { type: String, required: true },
        courseName: { type: String, required: true },
        maxMarks: {
          ct1: { type: Number, default: 30 },
          ct2: { type: Number, default: 30 },
          finalFaTh: { type: Number, default: 10 },
          faTh: { type: Number, default: 40 }, // CT average (30) + Final (10)
          saTh: { type: Number, default: 70 },
          faPr: { type: Number, default: 25 },
          saPr: { type: Number, default: 25 },
          sla: { type: Number, default: 25 }
        }
      }
    ],

    // Marks for each student across different courses
    studentMarks: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        rollNo: { type: String },
        studentName: { type: String },
        courses: [
          {
            courseCode: { type: String, required: true },
            ct1: { type: Number, default: null }, // Null if absent/not entered
            ct2: { type: Number, default: null },
            finalFaTh: { type: Number, default: null },
            faTh: { type: Number, default: null },
            saTh: { type: Number, default: null },
            faPr: { type: Number, default: null },
            saPr: { type: Number, default: null },
            sla: { type: Number, default: null }
          }
        ]
      }
    ],
    
    // Course-wise summary statistics (to support direct summary entry & overrides)
    courseStats: [
      {
        courseCode: { type: String, required: true },
        stats: [
          {
            passingHead: { type: String, required: true }, // "faTh", "ct1", "ct2", "finalFaTh", "saTh", "faPr", "saPr", "sla"
            lowest: { type: String, default: "" },
            highest: { type: String, default: "" },
            appeared: { type: Number, default: 0 },
            passed: { type: Number, default: 0 },
            passPct: { type: Number, default: 0 },
            above60Pct: { type: Number, default: 0 }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

// Unique index for specific program context
k7ResultSchema.index(
  { academicYear: 1, semester: 1, departmentId: 1, divisionId: 1 },
  { unique: true }
);

module.exports = mongoose.model("K7Result", k7ResultSchema);
