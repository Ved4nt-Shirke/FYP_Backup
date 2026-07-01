// Debug script to check student login credentials
// Run: node debug_student_login.js <username>
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/user');
const Student = require('./models/Student');

const username = process.argv[2] || '2320310003';

async function debugLogin() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/vidyalankarDB';
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Find User record
    const user = await User.findOne({ username });
    if (!user) {
      // Try case-insensitive
      const userCI = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (!userCI) {
        console.log(`❌ NO User record found for username: "${username}"`);
        console.log('\nSearching for similar users...');
        const similar = await User.find({ 
          username: { $regex: new RegExp(username.substring(0, 5), 'i') } 
        }).limit(5);
        similar.forEach(u => console.log(`  - username: "${u.username}", role: ${u.role}, college: ${u.college}`));
      } else {
        console.log(`⚠️  Found via case-insensitive: "${userCI.username}", role: ${userCI.role}, college: ${userCI.college}`);
      }
    } else {
      console.log(`✅ User record found:`);
      console.log(`   username: "${user.username}"`);
      console.log(`   role: ${user.role}`);
      console.log(`   college: ${user.college}`);
      console.log(`   password hash: ${user.password}`);
    }

    // Find Student record
    const student = await Student.findOne({ username });
    if (!student) {
      const studentCI = await Student.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
      if (!studentCI) {
        console.log(`\n❌ NO Student record found for username: "${username}"`);
        // Try by enrollmentNo
        const byEnroll = await Student.findOne({ enrollmentNo: username });
        if (byEnroll) {
          console.log(`\n⚠️  Found student by enrollmentNo:`);
          console.log(`   studentName: ${byEnroll.studentName}`);
          console.log(`   username: "${byEnroll.username}"`);
          console.log(`   plainPassword: "${byEnroll.plainPassword}"`);
        }
      } else {
        console.log(`\n✅ Student record (case-insensitive):`);
        console.log(`   studentName: ${studentCI.studentName}`);
        console.log(`   username: "${studentCI.username}"`);
        console.log(`   plainPassword: "${studentCI.plainPassword}"`);
        console.log(`   institution: ${studentCI.institution}`);
      }
    } else {
      console.log(`\n✅ Student record:`);
      console.log(`   studentName: ${student.studentName}`);
      console.log(`   username: "${student.username}"`);
      console.log(`   plainPassword: "${student.plainPassword}"`);
      console.log(`   institution: ${student.institution}`);
      console.log(`   enrollmentNo: ${student.enrollmentNo}`);

      // Check if password matches
      if (user && student.plainPassword) {
        const isMatch = await bcrypt.compare(student.plainPassword, user.password);
        console.log(`\n🔑 Password check (plainPassword vs User.password hash):`);
        console.log(`   plainPassword: "${student.plainPassword}"`);
        console.log(`   bcrypt.compare result: ${isMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        
        if (!isMatch) {
          console.log(`\n🚨 ROOT CAUSE: The plainPassword stored in Student does NOT match`);
          console.log(`   the hashed password in User collection.`);
          console.log(`   This means the User.password was updated after the plainPassword was stored.`);
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugLogin();
