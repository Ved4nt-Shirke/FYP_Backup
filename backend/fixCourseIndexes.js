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

const fixIndexes = async () => {
  try {
    await connectDB();

    console.log("📋 Current indexes on Course collection:");
    const indexes = await Course.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n🔧 Dropping all indexes (except _id)...");
    await Course.collection.dropIndexes();
    console.log("✅ Dropped all indexes");

    console.log("\n🔄 Recreating indexes from schema...");
    await Course.syncIndexes();
    console.log("✅ Recreated indexes");

    console.log("\n📋 New indexes:");
    const newIndexes = await Course.collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log("\n✅ Index repair complete!\n");
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

fixIndexes();
