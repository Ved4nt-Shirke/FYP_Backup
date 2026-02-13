const mongoose = require("mongoose");

const chaptersSchema = new mongoose.Schema({
  program: String,
  className: String,
  course: String,
  chp: [
    {
      chapterNo: Number,
      chapterName: String,
    },
  ],
});

module.exports = mongoose.model("Chapter", chaptersSchema);