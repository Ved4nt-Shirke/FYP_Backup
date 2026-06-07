const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const StudentResult = require('./models/StudentResult');
const Student = require('./models/Student');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/vidyalankarDB")
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Sample student results data
const sampleResults = [
  {
    subject: "Mathematics",
    examType: "Midterm",
    marks: 85,
    maxMarks: 100,
    grade: "A",
    date: new Date("2025-11-15"),
    semester: "Semester 1"
  },
  {
    subject: "Physics",
    examType: "Midterm",
    marks: 78,
    maxMarks: 100,
    grade: "B+",
    date: new Date("2025-11-18"),
    semester: "Semester 1"
  },
  {
    subject: "Chemistry",
    examType: "Practical",
    marks: 92,
    maxMarks: 100,
    grade: "A+",
    date: new Date("2025-11-20"),
    semester: "Semester 1"
  },
  {
    subject: "English",
    examType: "Final",
    marks: 88,
    maxMarks: 100,
    grade: "A",
    date: new Date("2025-12-05"),
    semester: "Semester 1"
  },
  {
    subject: "Computer Science",
    examType: "Project",
    marks: 95,
    maxMarks: 100,
    grade: "A+",
    date: new Date("2025-12-10"),
    semester: "Semester 1"
  }
];

async function populateStudentResults() {
  try {
    // Clear existing results
    await StudentResult.deleteMany({});
    console.log("Cleared existing student results");
    
    // For demo purposes, we'll use a placeholder student ID
    // In a real application, you would link to actual student records
    const placeholderStudentId = "507f1f77bcf86cd799439011"; // This is a valid ObjectId format
    
    // Add studentId to each result
    const resultsWithStudentId = sampleResults.map(result => ({
      ...result,
      studentId: placeholderStudentId
    }));
    
    // Insert sample results
    await StudentResult.insertMany(resultsWithStudentId);
    console.log("Sample student results populated successfully");
    
    // Verify insertion
    const count = await StudentResult.countDocuments();
    console.log(`Total student results in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error populating student results:", error);
    process.exit(1);
  }
}

// Run the population script
populateStudentResults();