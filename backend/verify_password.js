const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/user");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(async () => {
    console.log("Connected to MongoDB");
    const user = await User.findOne({ username: "shreyas.bandekar" });
    if (!user) {
      console.log("User shreyas.bandekar not found!");
      mongoose.disconnect();
      return;
    }

    console.log("User details:", {
      username: user.username,
      role: user.role,
      college: user.college,
      hashedPassword: user.password
    });

    // Check if faculty123 matches
    const isMatch = await bcrypt.compare("faculty123", user.password);
    console.log("Does 'faculty123' match existing hash?", isMatch);

    if (!isMatch) {
      console.log("Resetting password to 'faculty123'...");
      const hashed = await bcrypt.hash("faculty123", 10);
      user.password = hashed;
      await user.save();
      console.log("Password updated successfully!");

      // Verify again
      const reVerify = await bcrypt.compare("faculty123", user.password);
      console.log("Re-verification after reset:", reVerify);
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
