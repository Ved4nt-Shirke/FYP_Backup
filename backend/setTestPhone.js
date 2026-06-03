require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
    .then(async () => {
        const Faculty = require('./models/Faculty');

        const res = await Faculty.updateMany({}, { $set: { whatsappPhone: "919619085943" } });
        console.log(`Updated ${res.modifiedCount} faculty records to have the WhatsApp number 919619085943 for testing.`);

        mongoose.disconnect();
    })
    .catch(console.error);
