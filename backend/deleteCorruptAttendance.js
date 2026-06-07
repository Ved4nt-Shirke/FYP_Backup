require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
    .then(async () => {
        const TheoryAttendance = require('./models/TheoryAttendance');

        // Find records with 0 students or specifically the one for ciann 1340 and 2026-03-05
        const res = await TheoryAttendance.deleteMany({ ciannId: 1340, date: "2026-03-05" });
        console.log(`Deleted ${res.deletedCount} corrupted attendance records.`);

        mongoose.disconnect();
    })
    .catch(console.error);
