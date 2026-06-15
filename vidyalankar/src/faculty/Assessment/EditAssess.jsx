// src/components/assisment/assisment/EditAssess.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditAssess.css';

export default function EditAssess() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const navigate = useNavigate();
  
  // Standard batch options
  const batches = ['B1', 'B2', 'B3', 'B4', 'B5'];

  const handleSubmit = () => {
    if (selectedBatch) {
      // Navigate to batch assessment page
      navigate('/assessment/edit-prog', { state: { batch: selectedBatch } });
    } else {
      alert('Please select a batch first.');
    }
  };

  return (
    <div className="assessment-page-container">
      <div className="assessment-container">
        <h2>Batch Selection Assessment</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <label htmlFor="batch-select">Select Batch:</label>
          <select
            id="batch-select"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Select Batch --</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
          <button type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
