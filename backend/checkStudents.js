// GIT TRACKING CONFIRMATION - VEDANT
// checkStudents.js - Script to check and clean up student data
const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vidyalankarDB')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

async function checkAndCleanStudents() {
  try {
    // Get all students
    const allStudents = await Student.find({});
    console.log('\n=== ALL STUDENTS IN DATABASE ===');
    console.log(`Total students: ${allStudents.length}`);
    
    // Group by batch
    const batchGroups = {};
    allStudents.forEach(student => {
      if (!batchGroups[student.batch]) {
        batchGroups[student.batch] = [];
      }
      batchGroups[student.batch].push(student);
    });
    
    console.log('\n=== STUDENTS BY BATCH ===');
    Object.keys(batchGroups).forEach(batch => {
      console.log(`\nBatch "${batch}" (${batchGroups[batch].length} students):`);
      batchGroups[batch].forEach(student => {
        console.log(`  - ${student.rollNo}: ${student.studentName} (${student.enrollmentNo})`);
      });
    });
    
    // Remove test students (those with batch "B3" that I added)
    const testStudents = await Student.find({ batch: "B3" });
    if (testStudents.length > 0) {
      console.log(`\n=== REMOVING ${testStudents.length} TEST STUDENTS ===`);
      await Student.deleteMany({ batch: "B3" });
      console.log('Test students removed successfully');
    }
    
    // Show final state
    const finalStudents = await Student.find({});
    console.log(`\n=== FINAL STATE ===`);
    console.log(`Total students after cleanup: ${finalStudents.length}`);
    
    const finalBatches = [...new Set(finalStudents.map(s => s.batch))];
    console.log(`Available batches: ${finalBatches.join(', ')}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAndCleanStudents();