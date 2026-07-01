const mongoose = require("mongoose");

const experimentSchema = new mongoose.Schema({
  program: String,
  className: String,
  course: String,
  experiments: [
    {
      practicalNo: Number,
      practicalName: String,
    },
  ],
});

module.exports = mongoose.model("Experiment", experimentSchema);
