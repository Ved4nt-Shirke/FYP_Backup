// Repair script: sync User.password hash with Student.plainPassword for all mismatched records
// Run: node repair_student_passwords.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');
const Student = require('./models/Student');

async function repairPasswords() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/vidyalankarDB';
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Find all students that have both a username and plainPassword
    const students = await Student.find({
      username: { $exists: true, $ne: '' },
      plainPassword: { $exists: true, $ne: '' },
    });

    console.log(`Found ${students.length} student records with credentials.\n`);

    let fixed = 0;
    let alreadyOk = 0;
    let noUser = 0;
    let errors = 0;

    for (const student of students) {
      try {
        const user = await User.findOne({ username: student.username });
        
        if (!user) {
          console.log(`⚠️  No User account for student: ${student.studentName} (${student.username})`);
          noUser++;
          continue;
        }

        // Check if current hash matches plainPassword
        const isMatch = await bcrypt.compare(student.plainPassword, user.password);
        
        if (!isMatch) {
          // Fix: re-hash plainPassword and update User
          const newHash = await bcrypt.hash(student.plainPassword, 10);
          user.password = newHash;
          await user.save();
          console.log(`✅ Fixed: ${student.studentName} (${student.username}) at ${student.institution}`);
          fixed++;
        } else {
          alreadyOk++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${student.username}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n=== REPAIR SUMMARY ===');
    console.log(`✅ Fixed (password hash synced): ${fixed}`);
    console.log(`✓  Already correct:              ${alreadyOk}`);
    console.log(`⚠️  No User account found:        ${noUser}`);
    console.log(`❌ Errors:                        ${errors}`);
    console.log(`\nTotal processed: ${students.length}`);

    if (fixed > 0) {
      console.log('\n🎉 Repair complete! Students can now log in with their credentials.');
    } else if (alreadyOk === students.length) {
      console.log('\n✓ All passwords were already correct - no repair needed.');
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

repairPasswords();
