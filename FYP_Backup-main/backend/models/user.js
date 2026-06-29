const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  college: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["faculty", "student", "admin", "superadmin", "office", "hod", "academic_coordinator"],
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
});

module.exports = mongoose.model("User", UserSchema);
