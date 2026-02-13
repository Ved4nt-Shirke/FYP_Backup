const mongoose = require('mongoose');

const TutorialAttendanceSchema = new mongoose.Schema({
  Topic: String,
  actualDate: String,
  ciannId: Number,
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
}, {
  timestamps: true
});

module.exports = mongoose.models.TutorialAttendance || mongoose.model('TutorialAttendance', TutorialAttendanceSchema);