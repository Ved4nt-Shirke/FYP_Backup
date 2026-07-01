import React, { useState } from "react";

function StudentDetails({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    rollNo: "",
    enrollmentNo: "",
    studentName: "",
    batch: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div
      className="modal fade show"
      tabIndex="-1"
      style={{ display: "block", background: "rgba(0,0,0,0.3)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Student Details</h5>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <input
                  type="text"
                  name="rollNo"
                  className="form-control"
                  placeholder="Roll No."
                  value={formData.rollNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  name="enrollmentNo"
                  className="form-control"
                  placeholder="Enrollment No."
                  value={formData.enrollmentNo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  name="studentName"
                  className="form-control"
                  placeholder="Student Name"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  name="batch"
                  className="form-control"
                  placeholder="Batch"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn btn-success">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;
