require("dotenv").config();
const mongoose = require("mongoose");

const isUnique = (index) => Boolean(index?.unique);
const keys = (index) => Object.keys(index?.key || {});

const isDepartmentLegacyIndex = (index) => {
  if (!index || index.name === "_id_") return false;

  const keyFields = keys(index);

  if (!isUnique(index)) return false;

  if (index.name === "name_1" || index.name === "code_1") {
    return true;
  }

  if (keyFields.length === 1 && (keyFields[0] === "name" || keyFields[0] === "code")) {
    return true;
  }

  if (
    keyFields.length === 2 &&
    keyFields.includes("name") &&
    keyFields.includes("code") &&
    !keyFields.includes("institution")
  ) {
    return true;
  }

  return false;
};

const isDivisionLegacyIndex = (index) => {
  if (!index || index.name === "_id_") return false;

  const keyFields = keys(index);

  if (!isUnique(index)) return false;

  if (index.name === "name_1") {
    return true;
  }

  if (keyFields.length === 1 && keyFields[0] === "name") {
    return true;
  }

  return false;
};

const ensureIndex = async (collection, indexSpec, options) => {
  const existing = await collection.indexes();
  const targetName = options?.name;
  const hasTarget = existing.some((idx) => idx.name === targetName);

  if (hasTarget) {
    console.log(`Index already present: ${collection.collectionName}.${targetName}`);
    return;
  }

  console.log(`Creating index: ${collection.collectionName}.${targetName}`);
  await collection.createIndex(indexSpec, options);
};

async function fixCatalogIndexes() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vidyalankarDB";
  await mongoose.connect(mongoUri);

  const departmentsCollection = mongoose.connection.collection("departments");
  const divisionsCollection = mongoose.connection.collection("divisions");

  const departmentIndexes = await departmentsCollection.indexes();
  const departmentLegacy = departmentIndexes.filter(isDepartmentLegacyIndex);

  for (const index of departmentLegacy) {
    console.log(`Dropping legacy department index: ${index.name}`);
    await departmentsCollection.dropIndex(index.name);
  }

  await ensureIndex(
    departmentsCollection,
    { institution: 1, name: 1 },
    { unique: true, name: "institution_1_name_1" },
  );

  await ensureIndex(
    departmentsCollection,
    { institution: 1, code: 1 },
    { unique: true, name: "institution_1_code_1" },
  );

  const divisionIndexes = await divisionsCollection.indexes();
  const divisionLegacy = divisionIndexes.filter(isDivisionLegacyIndex);

  for (const index of divisionLegacy) {
    console.log(`Dropping legacy division index: ${index.name}`);
    await divisionsCollection.dropIndex(index.name);
  }

  await ensureIndex(
    divisionsCollection,
    { courseId: 1, name: 1 },
    { unique: true, name: "courseId_1_name_1" },
  );

  console.log("Catalog index fix completed successfully.");
}

fixCatalogIndexes()
  .catch((error) => {
    console.error("Failed to fix catalog indexes:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
