const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weekday: { type: String, required: true },
  time: { type: String, required: true },
  label: { type: String, required: true }
});

slotSchema.index({ owner: 1, weekday: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);