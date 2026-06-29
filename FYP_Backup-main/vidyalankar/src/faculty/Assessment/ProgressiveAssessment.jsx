// src/components/ProgressiveAssessment.jsx

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import './ProgressiveAssessment.css';

// The experiments array is currently empty as per your request
const experiments = [];

function ProgressiveAssessment() {
  const location = useLocation();
  const navigate = useNavigate(); // 2. Initialize the navigate function
  const { student, batch } = location.state || { student: 'Unknown', batch: 'Unknown' };

  const [marks, setMarks] = useState({});

  const handleMarksChange = (expId, value) => {
    if (/^\d*$/.test(value) && value <= 100) {
      setMarks(prevMarks => ({
        ...prevMarks,
        [expId]: value,
      }));
    }
  };

  // 3. Update the handleSubmit function
  const handleSubmit = (event) => {
    event.preventDefault();
    // In a real app, you would send the data to your server here.

    // Show the success message
    alert('Marks Updated Successfully!');

    // Navigate back to the main form page
    navigate('/');
  };

  return (
    <div className="progressive-assessment-container">
      <h2>Progressive Assessment</h2>
      <p className="student-info">
        Grading for: <strong>{student}</strong> ({batch})
      </p>
      <form onSubmit={handleSubmit}>
        <table className="marks-table">
          <thead>
            <tr>
              <th className="exp-id">Exp ID</th>
              <th className="exp-name">Exp Name</th>
              <th className="marks">Marks</th>
            </tr>
          </thead>
          <tbody>
            {experiments.length > 0 ? (
              experiments.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.id}</td>
                  <td>{exp.name}</td>
                  <td>
                    <input
                      type="text"
                      className="marks-input"
                      value={marks[exp.id] || ''}
                      onChange={(e) => handleMarksChange(exp.id, e.target.value)}
                      placeholder="Enter"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="empty-table-message">
  No matching records found
</td>
              </tr>
            )}
          </tbody>
        </table>
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
}

export default ProgressiveAssessment;
