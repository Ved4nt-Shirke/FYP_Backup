import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccessAlert, showErrorAlert } from '../../../utils/alertUtils.jsx';
import './EditIndividualAttendance.css'; // Reusing the same CSS file

const EditIndividualExtraTheoryAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordToEdit, selectedCiaanId } = location.state || {};

  const [formData, setFormData] = useState({
    _id: '',
    topic: '',
    date: '',
    students: [],
    CiaanId: ''
  });

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        _id: recordToEdit._id || '',
        topic: recordToEdit.topic || '',
        date: recordToEdit.date || '',
        students: recordToEdit.students || [],
        CiaanId: recordToEdit.CiaanId || selectedCiaanId
      });
    } else {
      setMessage('Error: No extra theory attendance record provided for editing.');
      setIsSuccess(false);
    }
  }, [recordToEdit, selectedCiaanId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleStudentStatusChange = (rollId) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.map(student =>
        student.rollId === rollId ? { ...student, attendance: student.attendance === 'Present' ? 'Absent' : 'Present' } : student
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      if (!formData._id) {
        throw new Error("Record ID is missing. Cannot update.");
      }

      const payloadForBackend = {
        topic: formData.topic,
        date: formData.date,
        students: formData.students,
        CiaanId: formData.CiaanId
      };

      // Update extra attendance record
      const url = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/${formData._id}`;
      console.log("Sending PUT request to:", url, "with payload:", payloadForBackend);

      const response = await axios.put(url, payloadForBackend);

      if (response.status === 200) {
        showSuccessAlert('Extra theory attendance updated successfully!');
        setTimeout(() => {
          navigate('/edit-extra-theory-attendance2', { state: { selectedCiaanId: selectedCiaanId } });
        }, 1500);
      } else {
        throw new Error(response.data.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      showErrorAlert(`Error saving changes: ${error.response?.data?.message || error.message}`);
      console.error('Error saving changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!recordToEdit) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <p className="error-heading">No record selected for editing.</p>
          <p>Please go back to the <button onClick={() => navigate('/edit-extra-theory-attendance2')} className="error-link-button">Edit Extra Theory Attendance List</button> to select a record.</p>
        </div>
      </div>
    );
  }

  const presentCount = formData.students ? formData.students.filter(student => student.attendance === 'Present').length : 0;
  const absentCount = formData.students ? formData.students.length - presentCount : 0;

  return (
    <div className="edit-attendance-page-container">
      <div className="edit-attendance-card">
        <h1 className="edit-attendance-heading">Edit Extra Theory Attendance</h1>

        {/* Attendance Information Display */}
        <div className="context-fields-container">
          <div>
            <span className="context-label">Ciaan ID:</span>
            <div className="context-value">{formData.CiaanId || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">Topic:</span>
            <div className="context-value">{formData.topic || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">Date:</span>
            <div className="context-value">{formData.date || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">Total Students:</span>
            <div className="context-value">{formData.students ? formData.students.length : 0}</div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{presentCount}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Present</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{absentCount}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Absent</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{formData.students ? formData.students.length : 0}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {formData.students && formData.students.length > 0 ? Math.round((presentCount / formData.students.length) * 100) : 0}%
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Attendance</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-attendance-form">
          <div>
            <label htmlFor="topic" className="form-label">
              Topic Covered
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter topic covered"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="form-label">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Students Section */}
          <div className="students-section">
            <h3 className="students-heading">Mark Attendance</h3>

            {formData.students && formData.students.length > 0 ? (
              <div className="table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Mark Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.students.map(student => (
                      <tr key={student.rollId}>
                        <td data-label="Roll No">{student.rollId}</td>
                        <td data-label="Student Name">{student.name}</td>
                        <td data-label="Mark Present">
                          <label className="custom-checkbox">
                            <input
                              type="checkbox"
                              checked={student.attendance === 'Present'}
                              onChange={() => handleStudentStatusChange(student.rollId)}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>No students found</div>
                <div style={{ fontSize: '14px' }}>Please check if students are enrolled for this extra theory class.</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons-container">
            <button
              type="button"
              onClick={() => navigate('/edit-extra-theory-attendance2', { state: { selectedCiaanId: selectedCiaanId } })}
              className="button-base button-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.students || formData.students.length === 0}
              className="button-base button-primary"
            >
              {isLoading ? 'Saving...' : 'Update Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIndividualExtraTheoryAttendance;
