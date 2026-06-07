const mongoose = require('mongoose');

const studentResultSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  examType: { 
    type: String, 
    required: true 
  },
  marks: { 
    type: Number, 
    required: true 
  },
  maxMarks: { 
    type: Number, 
    required: true 
  },
  grade: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  semester: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('StudentResult', studentResultSchema);