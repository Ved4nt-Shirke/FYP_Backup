import React, { useState } from 'react';

const MarksDropdown = ({ selectedMarks, onSelect }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customMarks, setCustomMarks] = useState('');

  const predefinedMarks = [5, 10, 15, 20, 25];

  const handleSelectMarks = (marks) => {
    onSelect(marks);
    setShowCustom(false);
    setCustomMarks('');
  };

  const handleCustomMarksChange = (e) => {
    const value = e.target.value;
    setCustomMarks(value);
  };

  const handleCustomMarksSubmit = () => {
    const marks = parseInt(customMarks, 10);
    if (isNaN(marks) || marks < 0 || marks > 25) {
      alert('Please enter a valid marks value between 0 and 25');
      return;
    }
    handleSelectMarks(marks);
  };

  return (
    <div className="marks-dropdown-container">
      <label className="form-label fw-bold">Select Marks (0-25)</label>

      <div className="d-flex gap-2 flex-wrap mb-3">
        {predefinedMarks.map((marks) => (
          <button
            key={marks}
            className={`btn btn-sm ${
              selectedMarks === marks ? 'btn-warning' : 'btn-outline-warning'
            }`}
            onClick={() => handleSelectMarks(marks)}
          >
            {marks}
          </button>
        ))}
        <button
          className={`btn btn-sm ${
            showCustom ? 'btn-info' : 'btn-outline-info'
          }`}
          onClick={() => setShowCustom(!showCustom)}
        >
          <i className="bi bi-pencil me-1"></i>Custom
        </button>
      </div>

      {showCustom && (
        <div className="custom-marks-input mb-3">
          <div className="input-group">
            <input
              type="number"
              className="form-control"
              min="0"
              max="25"
              placeholder="Enter custom marks (0-25)"
              value={customMarks}
              onChange={handleCustomMarksChange}
            />
            <button
              className="btn btn-info"
              type="button"
              onClick={handleCustomMarksSubmit}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {selectedMarks !== null && selectedMarks !== undefined && (
        <div className="alert alert-success d-flex align-items-center gap-2">
          <i className="bi bi-check-circle"></i>
          <span>Selected Marks: <strong>{selectedMarks}</strong></span>
        </div>
      )}
    </div>
  );
};

export default MarksDropdown;
