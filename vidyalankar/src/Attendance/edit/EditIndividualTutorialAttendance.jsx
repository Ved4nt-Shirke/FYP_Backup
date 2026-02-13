// EditIndividualTutorialAttendance.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { showSuccessAlert, showErrorAlert } from "../../utils/alertUtils.jsx";
import "./EditIndividualAttendance.css";

const EditIndividualTutorialAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { attendanceRecord, ciannId } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attendanceRecord) {
      setError("No attendance record provided");
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        // Fetch all students from the database
        const response = await axios.get("http://localhost:5000/api/students");
        setStudents(response.data);

        // Initialize attendance state with existing data
        const initialAttendance = {};
        response.data.forEach(student => {
          // Find if this student has attendance record
          const existingRecord = attendanceRecord.students?.find(
            s => s.rollId === student.rollNo || s.rollNo === student.rollNo
          );
          initialAttendance[student.rollNo] = existingRecord?.attendance === "Present";
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [attendanceRecord]);

  const handleCheckboxChange = (rollNo) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: !prev[rollNo]
    }));
  };

  const handleSave = async () => {
    if (!window.confirm("Are you sure you want to update this attendance record?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Prepare updated attendance data
      const updatedStudents = students.map(student => ({
        rollId: student.rollNo,
        name: student.studentName,
        attendance: attendance[student.rollNo] ? "Present" : "Absent"
      }));

      const updatedRecord = {
        ...attendanceRecord,
        students: updatedStudents
      };

      // Update the record in the database
      await axios.put(
        `http://localhost:5000/api/tutorial-attendance/${attendanceRecord._id}`,
        updatedRecord
      );

      showSuccessAlert("Tutorial attendance updated successfully!");
      navigate("/edit-tutorial-attendance2", { state: { selectedCiannId: ciannId } });
    } catch (error) {
      console.error("Error updating attendance:", error);
      setError("Failed to update attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/edit-tutorial-attendance2", { state: { selectedCiannId: ciannId } });
  };

  if (loading) {
    return (
      <div className="edit-attendance-page-container">
        <div className="edit-attendance-card">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading student data...</div>
            <div style={{ fontSize: '14px' }}>Please wait while we fetch the attendance information.</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message-box">
          <div className="error-heading">Error</div>
          <div style={{ marginBottom: '20px' }}>{error}</div>
          <button className="button-base button-secondary" onClick={handleCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="edit-attendance-page-container">
      <div className="edit-attendance-card">
        <h1 className="edit-attendance-heading">Edit Tutorial Attendance</h1>
        
        {/* Attendance Information Display */}
        <div className="context-fields-container">
          <div>
            <span className="context-label">Date:</span>
            <div className="context-value">{attendanceRecord.actualDate || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">Topic:</span>
            <div className="context-value">{attendanceRecord.Topic || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">CIAAN ID:</span>
            <div className="context-value">{ciannId || 'Not specified'}</div>
          </div>
          <div>
            <span className="context-label">Total Students:</span>
            <div className="context-value">{students.length}</div>
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
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{students.length}</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Attendance</div>
          </div>
        </div>

        {/* Students Section */}
        <div className="students-section">
          <h3 className="students-heading">Mark Attendance</h3>
          
          {students.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>No students found</div>
              <div style={{ fontSize: '14px' }}>Please check if students are enrolled for this tutorial.</div>
            </div>
          ) : (
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
                  {students.map(student => (
                    <tr key={student.rollNo}>
                      <td data-label="Roll No">{student.rollNo}</td>
                      <td data-label="Student Name">{student.studentName}</td>
                      <td data-label="Mark Present">
                        <label className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={attendance[student.rollNo] || false}
                            onChange={() => handleCheckboxChange(student.rollNo)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-container">
          <button 
            className="button-base button-secondary" 
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="button-base button-primary" 
            onClick={handleSave}
            disabled={saving || students.length === 0}
          >
            {saving ? "Saving..." : "Update Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditIndividualTutorialAttendance;
