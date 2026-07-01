import React from "react";
import "./MaxMarksSelector.css";

const MaxMarksSelector = ({ selectedMaxMarks, onSelect }) => {
  const maxMarksOptions = [5, 10, 15, 20, 25];

  return (
    <div className="max-marks-selector-container">
      <div className="card ptm-max-card ptm-max-card-compact">
        <div className="card-body ptm-max-body ptm-max-body-compact">
          <div className="ptm-max-topbar">
            <div className="ptm-max-title-wrap">
              <i className="bi bi-sliders2"></i>
              <span className="ptm-max-title">Maximum Marks</span>
            </div>

            <div className="ptm-max-quick-grid">
              {maxMarksOptions.map((marks) => (
                <button
                  key={marks}
                  type="button"
                  className={`ptm-max-quick-btn ${selectedMaxMarks === marks ? "active" : ""}`}
                  onClick={() => onSelect(marks)}
                >
                  <span className="ptm-max-quick-value">{marks}</span>
                </button>
              ))}
            </div>

            <select
              className="form-select ptm-max-select"
              value={selectedMaxMarks || ""}
              onChange={(e) => onSelect(Number(e.target.value) || "")}
              aria-label="Select maximum marks"
            >
              <option value="">Select</option>
              {maxMarksOptions.map((marks) => (
                <option key={marks} value={marks}>
                  Out of {marks}
                </option>
              ))}
            </select>
          </div>

          {selectedMaxMarks && (
            <div className="ptm-max-inline-note" role="status">
              <i className="bi bi-check2-circle"></i>
              <span>
                Students can enter marks between 0 and {selectedMaxMarks}.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaxMarksSelector;
