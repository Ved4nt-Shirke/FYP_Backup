import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./FinalAtt.css";

const FinalAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    ciannId,
    topic,
    date,
    remark,
    ciannData,
    chapter,
    startDate,
    teachingMethod,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ciannId || !topic || !date) {
      setIsLoading(false);
      return;
    }

    const params = {};
    const divisionId = ciannData?.divisionId?._id || ciannData?.divisionId;

    if (divisionId) {
      params.divisionId = divisionId;
    } else if (ciannData?.division) {
      params.division = ciannData.division;
    }

    axios
      .get("http://localhost:5000/api/students", { params })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setStudents(data);
        const initial = {};
        data.forEach((s) => {
          initial[s.rollNo] = false;
        });
        setAttendance(initial);
      })
      .catch(() => {
        setStudents([]);
        setAttendance({});
      })
      .finally(() => setIsLoading(false));
  }, [ciannId, topic, date, ciannData]);

  const handleToggle = (rollNo) => {
    setAttendance((prev) => ({
      ...prev,
      [rollNo]: !prev[rollNo],
    }));
  };

  const handleSelectAll = (val) => {
    const updated = {};
    students.forEach((s) => (updated[s.rollNo] = val));
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!window.confirm("Confirm attendance submission?")) return;

    const attendanceData = {
      ciannId,
      date,
      topic,
      remark,
      chapter,
      startDate,
      teachingMethod,
      students: students.map((student) => ({
        rollNo: student.rollNo,
        studentName: student.studentName,
        status: attendance[student.rollNo] ? "Present" : "Absent",
      })),
    };

    try {
      await axios.post(
        "http://localhost:5000/api/theory-attendance",
        attendanceData,
      );
      alert("Attendance submitted successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to submit attendance.");
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  if (!ciannId || !topic || !date) {
    return (
      <div className="final-container error-state">
        <p>Missing session data. Please restart the process.</p>
        <Link to="/theory-attendance" className="btn-secondary">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="final-container">
      <header className="page-header">
        <h2 className="page-title">Theory Attendance</h2>
        <div className="header-actions">
          <button onClick={() => handleSelectAll(true)} className="text-btn">
            Mark All Present
          </button>
          <button onClick={() => handleSelectAll(false)} className="text-btn">
            Clear All
          </button>
        </div>
      </header>

      {ciannData && (
        <div className="info-card">
          <div className="info-main">
            <h3>
              {ciannData.subject?.name}{" "}
              <span className="sub-text">({ciannData.subject?.code})</span>
            </h3>
            <div className="info-grid">
              <span>
                <strong>Division:</strong> {ciannData.division}
              </span>
              <span>
                <strong>Dept:</strong> {ciannData.department?.name}
              </span>
              <span>
                <strong>Semester:</strong> {ciannData.semester}
              </span>
            </div>
          </div>
          <div className="info-meta">
            <p>
              <strong>Topic:</strong> {topic}
            </p>
            <p>
              <strong>Date:</strong> {new Date(date).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="summary-row">
        <div className="stat-card">
          <span className="label">Total Students</span>
          <span className="value">{students.length}</span>
        </div>
        <div className="stat-card success">
          <span className="label">Present</span>
          <span className="value">{presentCount}</span>
        </div>
        <div className="stat-card danger">
          <span className="label">Absent</span>
          <span className="value">{absentCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-spinner">Loading student roster...</div>
      ) : (
        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th width="80">Roll</th>
                <th>Student Name</th>
                <th className="hide-mobile">Enrollment</th>
                <th width="100">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-msg">
                    No students found in this division.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.rollNo}
                    onClick={() => handleToggle(student.rollNo)}
                    className={attendance[student.rollNo] ? "row-present" : ""}
                  >
                    <td className="font-medium">{student.rollNo}</td>
                    <td>{student.studentName}</td>
                    <td className="hide-mobile text-muted">
                      {student.enrollmentNo || "-"}
                    </td>
                    <td>
                      <div
                        className={`status-pill ${attendance[student.rollNo] ? "present" : "absent"}`}
                      >
                        {attendance[student.rollNo] ? "Present" : "Absent"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <footer className="footer-action">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={students.length === 0}
        >
          Submit Attendance ({presentCount}/{students.length})
        </button>
      </footer>
    </div>
  );
};

export default FinalAttendance;
