import React, { useState } from "react";
import "./EditSyllabusForm.css";

function EditSyllabusForm({ onClose, onImagesSubmit }) {
  const [selectedFiles, setSelectedFiles] = useState(["", "", "", ""]);

  const handleFileChange = (e, index) => {
    const newFiles = [...selectedFiles];
    newFiles[index] = e.target.files[0];
    setSelectedFiles(newFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onImagesSubmit(selectedFiles);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-box">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="edit-sylly">Edit Syllabus Content</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="text-danger mb-3">
          Note: Upload only <span className="fw-bold">Theory</span> and{" "}
          <span className="fw-bold">Practical</span> images
        </p>

        <form onSubmit={handleSubmit}>
          {[1, 2, 3, 4].map((item, index) => (
            <div key={item} className="mb-3">
              <label className="form-label">Select image {item}</label>
              <input
                type="file"
                accept="image/jpeg, image/png"
                className="form-control"
                onChange={(e) => handleFileChange(e, index)}
              />
            </div>
          ))}

          <button type="submit" className="submit-btn">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditSyllabusForm;
