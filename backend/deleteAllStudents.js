const mongoose = require("mongoose");
const Student = require("./models/Student");

const deleteAllStudents = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB",
    );
    console.log("Connected to MongoDB");

    const result = await Student.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} students from database`);

    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error deleting students:", err.message);
    process.exit(1);
  }
};

deleteAllStudents();
