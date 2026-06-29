import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AssessmentStudentSelectForm.css';

const studentData = {
  'CS Batch 2024': ['Anjali Sharma', 'Rohan Gupta', 'Priya Singh'],
  'ECE Batch 2024': ['Vikram Kumar', 'Sneha Patel', 'Amit Desai'],
  'CS Batch 2025': ['Meera Iyer', 'Karan Mehta', 'Fatima Khan'],
};
const batchNames = Object.keys(studentData);

function AssessmentStudentSelectForm() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const navigate = useNavigate(); // Initialize the navigate function

  const studentsInBatch = selectedBatch ? studentData[selectedBatch] : [];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedBatch && selectedStudent) {
      // Navigate to student-specific assessment page
      navigate('/assessment/progressive', { state: { batch: selectedBatch, student: selectedStudent } });
    } else {
      alert('Please select both a batch and a student.');
    }
  };

  return (
    <div className="assessment-page-container">
    <div className="assessment-container">
      <h2>Select Student For Assessment</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="batch-select">Select Batch</label>
        <select id="batch-select" value={selectedBatch} onChange={(e) => { setSelectedBatch(e.target.value); setSelectedStudent(''); }} aria-label="Select Batch">
          <option value="">-- Select Batch --</option>
          {batchNames.map((batch, index) => (
            <option key={batch} value={batch}>{`Batch ${index + 1}`}</option>
          ))}
        </select>
        
        <label htmlFor="student-select">Select Student</label>
        <select id="student-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
          <option value="">{selectedBatch ? '-- Select Student --' : '-- Select a Batch First --'}</option>
          {studentsInBatch.map((student) => (
            <option key={student} value={student}>{student}</option>
          ))}
        </select>
        <button type="submit">Submit</button>
      </form>
    </div>
    </div>
  );
}

export default AssessmentStudentSelectForm;
