require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
    .then(async () => {
        const Faculty = require('./models/Faculty');

        // Check faculty collections
        const facultyWithPhone = await Faculty.find({ whatsappPhone: { $exists: true, $ne: "" } });
        console.log("Faculty with whatsappPhone:", facultyWithPhone.map(f => ({ name: f.fullName, phone: f.whatsappPhone })));

        const allFaculty = await Faculty.find({}).limit(5);
        console.log("Sample Faculty entries (no phone?):", allFaculty.map(f => ({ name: f.fullName, username: f.generatedUsername, phone: f.whatsappPhone })));

        // Let's forcibly update the user with '9619085943' in their skills or somewhere, or just set it for Shlok
        // Wait, let's find if "Shlok" exists and update his phone 
        // And generally, let's update anyone missing it just for testing 
        // Actually just logging for now.

        mongoose.disconnect();
    })
    .catch(console.error);
