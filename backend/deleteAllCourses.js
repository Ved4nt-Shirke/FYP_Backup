const mongoose = require("mongoose");
const Course = require("./models/Course");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB",
    );
    console.log("Connected to MongoDB\n");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const deleteAllCourses = async () => {
  try {
    await connectDB();

    const result = await Course.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} course(s)\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

deleteAllCourses();
