import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./FinalAtt.css";

const FinalAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    CiaanId,
    topic,
    date,
    remark,
    CiaanData,
    chapter,
    startDate,
    teachingMethod,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!CiaanId || !topic || !date) {
      setIsLoading(false);
      return;
    }

    const params = {};
    const divisionId = CiaanData?.divisionId?._id || CiaanData?.divisionId;

    if (divisionId) {
      params.divisionId = divisionId;
    } else if (CiaanData?.division) {
      params.division = CiaanData.division;
    }

    if (CiaanData?.academicYear) {
      params.academicYear = CiaanData.academicYear;
    }

    axios
      .get(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students`, { params })
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
  }, [CiaanId, topic, date, CiaanData]);

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

  const handleToggleAll = () => {
    const updated = {};
    students.forEach((s) => {
      updated[s.rollNo] = !attendance[s.rollNo];
    });
    setAttendance(updated);
  };

  const handleReset = () => {
    const updated = {};
    students.forEach((s) => {
      updated[s.rollNo] = false;
    });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!window.confirm("Confirm attendance submission?")) return;

    const attendanceData = {
      CiaanId,
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
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/theory-attendance`,
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

  const filteredStudents = students.filter((student) => {
    const query = searchTerm.trim().toLowerCase();
    const studentName = (student.studentName || "").toLowerCase();
    const enrollment = (student.enrollmentNo || "").toLowerCase();
    const roll = String(student.rollNo || "").toLowerCase();

    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      enrollment.includes(query) ||
      roll.includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (statusFilter === "present") {
      return Boolean(attendance[student.rollNo]);
    }

    if (statusFilter === "absent") {
      return !attendance[student.rollNo];
    }

    return true;
  });

  if (!CiaanId || !topic || !date) {
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
      <header className="final-att-header">
        <div>
          <h2 className="final-att-title">Mark Theory Attendance</h2>
          <p className="final-att-subtitle">
            Smart controls + card view for faster attendance marking
          </p>
        </div>
        <div className="final-att-actions">
          <button
            onClick={() => handleSelectAll(true)}
            className="final-att-action-btn"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleSelectAll(false)}
            className="final-att-action-btn"
          >
            Mark All Absent
          </button>
          <button onClick={handleToggleAll} className="final-att-action-btn">
            Toggle All
          </button>
          <button onClick={handleReset} className="final-att-action-btn ghost">
            Reset
          </button>
        </div>
      </header>

      {CiaanData && (
        <div className="info-card">
          <div className="info-main">
            <h3>
              {CiaanData.subject?.name}{" "}
              <span className="sub-text">({CiaanData.subject?.code})</span>
            </h3>
            <div className="info-grid">
              <span>
                <strong>Division:</strong> {CiaanData.division}
              </span>
              <span>
                <strong>Dept:</strong> {CiaanData.department?.name}
              </span>
              <span>
                <strong>Semester:</strong> {CiaanData.semester}
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
        <div className="final-stat-card">
          <span className="label">Total Students</span>
          <span className="value">{students.length}</span>
        </div>
        <div className="final-stat-card success">
          <span className="label">Present</span>
          <span className="value">{presentCount}</span>
        </div>
        <div className="final-stat-card danger">
          <span className="label">Absent</span>
          <span className="value">{absentCount}</span>
        </div>
      </div>

      <div className="final-toolbar">
        <input
          type="text"
          className="final-search"
          placeholder="Search by roll, name, enrollment..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="final-filter-chips" role="tablist" aria-label="Filter">
          <button
            type="button"
            className={`final-filter-chip ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({students.length})
          </button>
          <button
            type="button"
            className={`final-filter-chip ${statusFilter === "present" ? "active" : ""}`}
            onClick={() => setStatusFilter("present")}
          >
            Present ({presentCount})
          </button>
          <button
            type="button"
            className={`final-filter-chip ${statusFilter === "absent" ? "active" : ""}`}
            onClick={() => setStatusFilter("absent")}
          >
            Absent ({absentCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-spinner">Loading student roster...</div>
      ) : (
        <div className="students-panel">
          {students.length === 0 ? (
            <div className="empty-msg">No students found in this division.</div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-msg">
              No students match the selected filter.
            </div>
          ) : (
            <div className="final-students-grid">
              {filteredStudents.map((student) => (
                <div
                  key={student.rollNo}
                  className={`final-student-card ${attendance[student.rollNo] ? "present" : "absent"}`}
                  onClick={() => handleToggle(student.rollNo)}
                >
                  <div className="final-student-header">
                    <span className="final-roll-badge">{student.rollNo}</span>
                    <button
                      type="button"
                      className={`status-pill status-toggle ${attendance[student.rollNo] ? "present" : "absent"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggle(student.rollNo);
                      }}
                    >
                      {attendance[student.rollNo] ? "Present" : "Absent"}
                    </button>
                  </div>
                  <div className="final-student-name">
                    {student.studentName}
                  </div>
                  <div className="final-student-meta">
                    Enrollment: {student.enrollmentNo || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="footer-action">
        <button
          className="final-att-submit-btn"
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
