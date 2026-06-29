/*
  backfillOwners.js
  Purpose: Backfill `owner` field for collections where it's missing.
  Usage: Set BACKFILL_ADMIN_ID to the ObjectId string you want to assign as owner for orphaned records,
         then run `node scripts/backfillOwners.js` from the `backend` folder.

  NOTE: Review and run on a backup or staging DB first.
*/

const mongoose = require('mongoose');
require('dotenv').config();

const modelsToBackfill = [
  'Student',
  'Assessment',
  'TeachingPlan',
  'PracticalAttendance',
  'Notice'
];

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidyalankarDB';
  const adminId = process.env.BACKFILL_ADMIN_ID;

  if (!adminId) {
    console.error('Please set BACKFILL_ADMIN_ID in your environment to the ObjectId to assign to orphaned records.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', mongoUri);

  try {
    for (const modelName of modelsToBackfill) {
      console.log('\nProcessing model:', modelName);
      let Model;
      try {
        Model = require(`../models/${modelName}`);
      } catch (e) {
        console.warn('Model not found:', modelName, '- skipping');
        continue;
      }

      const filter = { $or: [{ owner: { $exists: false } }, { owner: null }] };
      const count = await Model.countDocuments(filter);
      console.log('Orphaned documents:', count);

      if (count === 0) continue;

      const result = await Model.updateMany(filter, { $set: { owner: mongoose.Types.ObjectId(adminId) } });
      console.log(`Updated ${result.modifiedCount || result.nModified || result.modified} documents for ${modelName}`);
    }
  } catch (err) {
    console.error('Error during backfill:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected and exiting');
  }
}

main();
