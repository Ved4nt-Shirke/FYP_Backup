const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/user");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(async () => {
    console.log("Connected to MongoDB");

    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash("admin123", 10);
    
    await User.updateOne({ username: "vp.admin" }, { password: hashed });
    await User.updateOne({ username: "007.admin" }, { password: hashed });
    
    console.log("Admin passwords reset successfully to: admin123");

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
