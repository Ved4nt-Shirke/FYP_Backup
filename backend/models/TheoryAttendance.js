// TheoryAttendance.js
const mongoose = require('mongoose');

const studentStatusSchema = new mongoose.Schema({
  rollNo: String,
  studentName: String,
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Absent',
  },
});

const theoryAttendanceSchema = new mongoose.Schema({
  ciannId: { type: Number, required: true }, // Changed to Number to match Ciann schema
  date: String,
  topic: String,
  chapter: String,
  startDate: String,
  teachingMethod: String,
  remark: String,
  students: [studentStatusSchema],
});

module.exports = mongoose.model('TheoryAttendance', theoryAttendanceSchema);