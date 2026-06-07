const mongoose = require('mongoose');

const ExtraPractSchema = new mongoose.Schema({
  ciannId: { type: Number, required: true },
  experiments: String,
  actualDate: String,
  batch: String,
  students: [
    {
      rollId: String,
      name: String,
      attendance: String // "Present" or "Absent"
    }
  ]
});

module.exports = mongoose.model('ExtraPract', ExtraPractSchema);