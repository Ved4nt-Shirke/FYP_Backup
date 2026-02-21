const mongoose = require("mongoose");
require("dotenv").config();

async function fixDepartmentIndexes() {
  try {
    console.log("🔧 Fixing Department collection indexes...");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    const Department = require("./models/Department");

    // Get existing indexes
    const indexes = await Department.collection.getIndexes();
    console.log("\n📋 Current indexes:");
    console.log(indexes);

    // Drop problematic indexes
    const indexesToDrop = [];
    for (const [indexName, indexSpec] of Object.entries(indexes)) {
      if (indexName === "_id_") continue; // Don't drop the _id index

      // Drop global unique indexes on name and code
      if (indexName === "name_1" || indexName === "code_1") {
        indexesToDrop.push(indexName);
      }
    }

    // Drop indexes
    for (const indexName of indexesToDrop) {
      console.log(`\n🗑️  Dropping index: ${indexName}`);
      await Department.collection.dropIndex(indexName);
      console.log(`✓ Dropped ${indexName}`);
    }

    // Create new compound indexes
    console.log("\n📝 Creating new compound indexes...");

    // Create compound unique index for name + institution
    await Department.collection.createIndex(
      { name: 1, institution: 1 },
      { unique: true },
    );
    console.log("✓ Created index: name_1_institution_1 (unique)");

    // Create compound unique index for code + institution
    await Department.collection.createIndex(
      { code: 1, institution: 1 },
      { unique: true },
    );
    console.log("✓ Created index: code_1_institution_1 (unique)");

    // Get final indexes
    const finalIndexes = await Department.collection.getIndexes();
    console.log("\n📋 Final indexes:");
    console.log(finalIndexes);

    console.log("\n✅ Department indexes fixed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing indexes:", err.message);
    process.exit(1);
  }
}

fixDepartmentIndexes();
