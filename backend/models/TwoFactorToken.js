const mongoose = require("mongoose");

const TwoFactorTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Expires in 5 minutes (TTL index in MongoDB)
  },
});

module.exports = mongoose.model("TwoFactorToken", TwoFactorTokenSchema);
