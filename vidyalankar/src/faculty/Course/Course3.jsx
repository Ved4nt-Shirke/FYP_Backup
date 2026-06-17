import React, { useState } from 'react';

const AddPracticalModal = ({ isOpen, onClose, onSubmit }) => {
  const [practicalNumber, setPracticalNumber] = useState('');
  const [practicalName, setPracticalName] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!practicalNumber || !practicalName) {
      alert('Please fill out all fields.');
      return;
    }
    
    // Pass the data up to the parent component
    onSubmit({ practicalNo: practicalNumber, practicalName });

    // ✅ Clear the form fields after submitting
    setPracticalNumber('');
    setPracticalName('');
  };

  // ... The rest of the JSX remains exactly the same
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Practicals</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="practicalNumber">Practical Number</label>
              <input
                type="text"
                id="practicalNumber"
                value={practicalNumber}
                onChange={(e) => setPracticalNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="practicalName">Practical Name</label>
              <input
                type="text"
                id="practicalName"
                value={practicalName}
                onChange={(e) => setPracticalName(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="submit" className="submit-btn">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPracticalModal;
