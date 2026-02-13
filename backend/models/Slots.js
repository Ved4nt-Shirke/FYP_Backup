const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  weekday: { type: String, required: true },
  time: { type: String, required: true },
  label: { type: String, required: true }
});

module.exports = mongoose.model('Slot', slotSchema);