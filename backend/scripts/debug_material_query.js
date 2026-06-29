const mongoose = require('mongoose');
const StudyMaterial = require('../models/StudyMaterial');

const MONGO_URI = 'mongodb://127.0.0.1:27017/vidyalankarDB';

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    const all = await StudyMaterial.find({});
    console.log('1. All materials count via model:', all.length);

    const query1 = { institution: '007' };
    const res1 = await StudyMaterial.find(query1);
    console.log(`2. Query { institution: '007' } count:`, res1.length);

    const query2 = { isActive: true };
    const res2 = await StudyMaterial.find(query2);
    console.log(`3. Query { isActive: true } count:`, res2.length);

    const query3 = { isDraft: { $ne: true } };
    const res3 = await StudyMaterial.find(query3);
    console.log(`4. Query { isDraft: { $ne: true } } count:`, res3.length);

    const query4 = { courseId: new mongoose.Types.ObjectId('6a3e0e90f44f8d80d5ea0061') };
    const res4 = await StudyMaterial.find(query4);
    console.log(`5. Query { courseId: ObjectId('6a3e0e90f44f8d80d5ea0061') } count:`, res4.length);

    const query5 = { divisionId: new mongoose.Types.ObjectId('6a3e0e93f44f8d80d5ea0069') };
    const res5 = await StudyMaterial.find(query5);
    console.log(`6. Query { divisionId: ObjectId('6a3e0e93f44f8d80d5ea0069') } count:`, res5.length);

    // Full query combined
    const fullQuery = {
      institution: '007',
      isActive: true,
      isDraft: { $ne: true },
      courseId: new mongoose.Types.ObjectId('6a3e0e90f44f8d80d5ea0061'),
      divisionId: new mongoose.Types.ObjectId('6a3e0e93f44f8d80d5ea0069')
    };
    const fullRes = await StudyMaterial.find(fullQuery);
    console.log('7. Full combined query count:', fullRes.length);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

run();
