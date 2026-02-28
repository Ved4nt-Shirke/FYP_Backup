require("dotenv").config();
const mongoose = require("mongoose");

const TARGET_COLLECTION = "courses";
const TARGET_INDEX_NAME = "institution_1_courseCode_1";

const shouldDropLegacyCourseIndex = (index) => {
  if (!index || index.name === "_id_") return false;
  if (index.name === TARGET_INDEX_NAME) return false;

  const keyFields = Object.keys(index.key || {});

  if (index.name === "courseId_1") {
    return true;
  }

  if (keyFields.includes("name") || keyFields.includes("courseName")) {
    return true;
  }

  if (index.unique && keyFields.includes("courseId")) {
    return true;
  }

  if (
    index.unique &&
    keyFields.length === 2 &&
    keyFields.includes("departmentId") &&
    keyFields.includes("name")
  ) {
    return true;
  }

  return false;
};

async function fixCourseIndexes() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB";

  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.collection(TARGET_COLLECTION);

  const indexes = await collection.indexes();
  const legacyIndexes = indexes.filter(shouldDropLegacyCourseIndex);

  if (legacyIndexes.length === 0) {
    console.log("No legacy course indexes found.");
  } else {
    for (const index of legacyIndexes) {
      console.log(`Dropping legacy index: ${index.name}`);
      await collection.dropIndex(index.name);
    }
  }

  const refreshed = await collection.indexes();
  const hasTargetIndex = refreshed.some((index) => index.name === TARGET_INDEX_NAME);

  if (!hasTargetIndex) {
    console.log("Creating required unique index: institution + courseCode");
    await collection.createIndex(
      { institution: 1, courseCode: 1 },
      { unique: true, name: TARGET_INDEX_NAME },
    );
  } else {
    console.log("Required unique index already present: institution + courseCode");
  }

  console.log("Course index fix completed successfully.");
}

fixCourseIndexes()
  .catch((error) => {
    console.error("Failed to fix course indexes:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
