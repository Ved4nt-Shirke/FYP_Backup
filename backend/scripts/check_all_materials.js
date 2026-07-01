const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/vidyalankarDB';

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const coll = db.collection('studymaterials');

    const docs = await coll.find({}).toArray();
    console.log(`Found ${docs.length} documents in studymaterials collection:`);

    docs.forEach((d, idx) => {
      console.log(`\n--- Material [${idx + 1}] ---`);
      console.log({
        _id: d._id,
        title: d.title,
        subject: d.subject,
        category: d.category,
        resourceType: d.resourceType,
        courseId: d.courseId,
        divisionId: d.divisionId,
        divisionName: d.divisionName,
        isActive: d.isActive,
        isDraft: d.isDraft,
        institution: d.institution
      });
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

run();
