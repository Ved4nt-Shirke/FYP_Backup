const mongoose = require('mongoose');

const TutorialAttendanceSchema = new mongoose.Schema({
  Topic: String,
  actualDate: String,
  CiaanId: Number,
  subject: {
    name: String,
    code: String
  },
  division: String,
  students: [
    {
      rollId: String,
      name: String,
      attendance: String,
    },
  ],
  remark: String,
}, {
  timestamps: true
});

module.exports = mongoose.models.TutorialAttendance || mongoose.model('TutorialAttendance', TutorialAttendanceSchema);