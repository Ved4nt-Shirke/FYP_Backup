require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
    .then(async () => {
        const Faculty = require('./models/Faculty');

        // Clear out 919619085943 from everyone
        await Faculty.updateMany({}, { $set: { whatsappPhone: "" } });

        // Set 919619085943 ONLY for Varsha Lokhande
        const res = await Faculty.updateOne(
            { fullName: { $regex: /varsha/i } },
            { $set: { whatsappPhone: "919619085943" } }
        );

        console.log(`Cleared all numbers, and assigned 919619085943 to Varsha Lokhande (Matched: ${res.matchedCount}, Modified: ${res.modifiedCount})`);

        mongoose.disconnect();
    })
    .catch(console.error);
