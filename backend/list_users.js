const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vidyalankarDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to database.");
    const users = await User.find({}, "username role").limit(10);
    console.log("Existing users:", users);
    
    // Check if we have any faculty user
    const faculty = await User.findOne({ role: "faculty" });
    if (faculty) {
      console.log("Found faculty user:", faculty.username);
    } else {
      console.log("No faculty user found.");
    }
    
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
