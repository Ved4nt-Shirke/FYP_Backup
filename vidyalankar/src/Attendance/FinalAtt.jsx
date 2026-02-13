// Attendance/FinalAtt.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TheoryEdit.css';

const FinalAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // ✅ 1. Receive the new fields from the navigation state
  const { ciannId, topic, date, remark, ciannData, chapter, startDate, teachingMethod } = location.state || {};
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ... useEffect logic remains the same
    if (!ciannId || !topic || !date) {
      setIsLoading(false);
      return;
    }
    axios.get("http://localhost:5000/api/students")
      .then(res => {
        setStudents(res.data);
        const initialAttendance = {};
        res.data.forEach(student => {
          initialAttendance[student.rollNo] = false;
        });
        setAttendance(initialAttendance);
      })
      .catch(err => console.error("Error fetching students:", err))
      .finally(() => setIsLoading(false));
  }, [ciannId, topic, date]);

  const handleCheckboxChange = (rollNo) => {
    setAttendance(prev => ({ ...prev, [rollNo]: !prev[rollNo] }));
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the attendance?")) return;

    // ✅ 2. Add the new fields to the data object being sent to the server
    const attendanceData = {
      ciannId,
      date,
      topic,
      remark,
      chapter,
      startDate,
      teachingMethod,
      students: students.map(student => ({
        rollNo: student.rollNo,
        studentName: student.studentName,
        status: attendance[student.rollNo] ? "Present" : "Absent"
      }))
    };

    try {
      await axios.post("http://localhost:5000/api/theory-attendance", attendanceData);
      alert("Attendance submitted successfully!");
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to submit attendance. Please try again.";
      alert(errorMessage);
      console.error("Error submitting attendance:", err);
    }
  };

  if (!ciannId || !topic || !date) {
    return (
      <div className="timetable-main-content">
        <div className="theory-attendance-container">
          <div className="error-message-container">
            <p>Error: Missing required data (ID, topic, or date).</p>
            <Link to="/theory-attendance" className="go-back-link">
              Please click here to go back and start over.
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Final Attendance Sheet</h3>
        </div>
        <div className="toolbar">
          <p><strong>CIAAN ID:</strong> {ciannId}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Topic:</strong> {topic}</p>
          {remark && <p><strong>Remark:</strong> {remark}</p>}
        </div>

        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="table-container">
            <table>
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
                    <td>{student.rollNo}</td>
                    <td>{student.studentName}</td>
                    <td>
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

        <div className="submit-wrapper">
          <button className="submit-button" onClick={handleSubmit} disabled={isLoading || students.length === 0}>
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalAttendance;
