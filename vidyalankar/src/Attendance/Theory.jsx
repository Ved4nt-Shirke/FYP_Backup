// Attendance/Theory.jsx
import React, { useState } from 'react';
import './Theory.css';

/**
 * A helper function to get today's date in 'YYYY-MM-DD' format,
 * which is required by the <input type="date"> element.
 * It also accounts for timezone offsets to prevent off-by-one day errors.
 */
const getTodayDateString = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const todayWithOffset = new Date(today.getTime() - (offset * 60 * 1000));
  return todayWithOffset.toISOString().split('T')[0];
};

const AttendanceForm = ({ chapterNo, chapterName, endDate, onClose, onSubmit }) => {
  // Get today's date for defaults and validation
  const today = getTodayDateString();

  const [actualDate, setActualDate] = useState(today);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!actualDate) {
      setError("Please select the actual date.");
      return;
    }
    setError(''); // Clear any existing errors
    onSubmit(actualDate, remark); // Pass data back to parent
  };

  return (
    <div className="theory-attendance-modal-overlay">
      <div className="theory-attendance-form">
        <h2>Theory Attendance Form</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            <div className="theory-form-group">
              <label>Chapter No.</label>
              <input type="text" value={chapterNo || ''} readOnly />
            </div>
            <div className="theory-form-group">
              <label>Sub Topic</label>
              <input type="text" value={chapterName || ''} readOnly />
            </div>
            <div className="theory-form-group">
              <label>Planned Date</label>
              <input type="text" value={endDate || ''} readOnly />
            </div>
            <div className="theory-form-group">
              <label>Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => {
                  setActualDate(e.target.value);
                  if (e.target.value) setError('');
                }}
                max={today}
                required
              />
              {error && <p className="validation-error">{error}</p>}
            </div>
            <div className="theory-form-group">
              <label>Remark (Optional)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter any remarks"
              />
            </div>
            <div className="button-group">
              <button type="button" className="btn cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn submit">Proceed to Mark Attendance</button>
            </div>
          </form>
        </div>
        {/* --- FIX START: Added footer element from screenshot --- */}
        <footer>
          Copyright © 2019. All rights reserved Vidyalankar Polytechnic
        </footer>
        {/* --- FIX END --- */}
      </div>
    </div>
  );
};

export default AttendanceForm;
