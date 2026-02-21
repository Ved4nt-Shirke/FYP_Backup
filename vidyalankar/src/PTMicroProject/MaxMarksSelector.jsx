import React from 'react';
import './MaxMarksSelector.css';

const MaxMarksSelector = ({ selectedMaxMarks, onSelect }) => {
  const maxMarksOptions = [5, 10, 15, 20, 25];

  return (
    <div className="max-marks-selector-container">
      <div className="card">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">
            <i className="bi bi-gear me-2"></i>
            Select Maximum Marks (Out Of)
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4">
            Choose the maximum marks you want to give to students for this activity.
          </p>

          <div className="row justify-content-center">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Marks (Out Of)</label>
              <select
                className="form-select form-select-lg"
                value={selectedMaxMarks || ''}
                onChange={(e) => onSelect(Number(e.target.value))}
              >
                <option value="">-- Select Maximum Marks --</option>
                {maxMarksOptions.map((marks) => (
                  <option key={marks} value={marks}>
                    {marks}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMaxMarks && (
            <div className="alert alert-success mt-4" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              You selected <strong>{selectedMaxMarks} marks out of {selectedMaxMarks}</strong>
              <br />
              <small className="text-muted d-block mt-2">
                Students can score from 0 to {selectedMaxMarks} marks
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaxMarksSelector;
