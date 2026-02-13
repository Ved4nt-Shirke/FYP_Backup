const mongoose = require("mongoose");

const extraAttendanceSchema = new mongoose.Schema({
  ciannId: { type: Number, required: true },
  topic: String,
  date: String,
  students: [
    {
      rollId: String,
      name: String,
      attendance: String, // 'Present' or 'Absent'
    },
  ],
});

const ExtraAttendance = mongoose.model("ExtraAttendance", extraAttendanceSchema);
module.exports = ExtraAttendance;
