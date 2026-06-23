import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import "./edit/EditIndividualAttendance.css";

const StudentAttendance = () => {
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ciannDataStr = localStorage.getItem("ciannData");

    const params = {};
    if (ciannDataStr) {
      try {
        const ciannData = JSON.parse(ciannDataStr);
        if (ciannData.divisionId?._id || ciannData.divisionId) {
          params.divisionId = ciannData.divisionId?._id || ciannData.divisionId;
        } else if (ciannData.division) {
          params.division = ciannData.division;
        }
        if (ciannData.academicYear) {
          params.academicYear = ciannData.academicYear;
        }
      } catch (err) {
        console.error("Error parsing ciannData:", err);
      }
    }

    axios
      .get(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students`, { params })
      .then((res) => {
        const studentList = res.data.map((student) => ({
          rollId: student.rollNo,
          name: student.studentName,
          enrollmentNo: student.enrollmentNo || "N/A",
          batch: student.batch || "N/A",
          attendance: "Absent",
        }));
        setStudents(studentList);
      })
      .catch((err) => {
        console.error("Failed to fetch students:", err);
        setStudents([]);
      });
  }, []);

  const toggleAttendance = (index) => {
    const updated = [...students];
    updated[index].attendance =
      updated[index].attendance === "Present" ? "Absent" : "Present";
    setStudents(updated);
  };

  const handleSubmit = async () => {
    try {
      const topic = localStorage.getItem("topic");
      const actualDate = localStorage.getItem("date");
      const ciannDataStr = localStorage.getItem("ciannData");

      if (!topic || !actualDate) {
        setIsSuccess(false);
        setMessage("Missing topic or date from local storage.");
        return;
      }

      if (!ciannDataStr) {
        setIsSuccess(false);
        setMessage("Missing CIANN data. Please select a CIANN first.");
        return;
      }

      const ciannData = JSON.parse(ciannDataStr);
      const payload = {
        Topic: topic,
        actualDate,
        students,
        ciannId: ciannData.ciannId,
        subject: ciannData.subject,
        division: ciannData.division,
      };

      setIsSubmitting(true);
      setMessage("");

      await axios.post(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/tutorial-attendance`,
        payload,
      );

      setIsSuccess(true);
      setMessage("Tutorial attendance submitted successfully.");

      localStorage.removeItem("topic");
      localStorage.removeItem("date");
      localStorage.removeItem("ciannData");

      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      console.error("Error submitting attendance:", err);
      setIsSuccess(false);
      setMessage("Submission failed. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const data = students.map((student) => ({
      "Roll ID": student.rollId,
      Name: student.name,
      Mark: student.attendance === "Present" ? "✔" : "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "Student_Attendance.xlsx");
  };

  const presentCount = students.filter(
    (student) => student.attendance === "Present",
  ).length;
  const totalCount = students.length;
  const absentCount = totalCount - presentCount;
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const ciannDataStr = localStorage.getItem("ciannData");
  const topic = localStorage.getItem("topic");
  const date = localStorage.getItem("date");
  let ciannData = null;
  try {
    ciannData = ciannDataStr ? JSON.parse(ciannDataStr) : null;
  } catch (err) {
    console.error("Error parsing ciannData:", err);
  }

  return (
    <div className="eia-page">
      <div className="eia-hero">
        <h1 className="eia-hero-title">Mark Tutorial Attendance</h1>
        <p className="eia-hero-subtitle">
          {ciannData?.subject?.name || "Tutorial Session"}
        </p>
      </div>

      <div className="eia-container">
        {message && (
          <div
            className={`eia-alert eia-alert-${isSuccess ? "success" : "error"}`}
          >
            <i
              className={`bi bi-${isSuccess ? "check-circle" : "x-circle"}`}
            ></i>
            {message}
          </div>
        )}

        <div className="eia-context-card">
          <div className="eia-context-header">
            <span>Tutorial Context</span>
          </div>
          <div className="eia-context-grid">
            <div className="eia-context-item">
              <span className="eia-context-label">Subject</span>
              <span className="eia-context-value">
                {ciannData?.subject?.name || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Subject Code</span>
              <span className="eia-context-value">
                {ciannData?.subject?.code || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Division</span>
              <span className="eia-context-value">
                {ciannData?.division || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Topic</span>
              <span className="eia-context-value">{topic || "N/A"}</span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Date</span>
              <span className="eia-context-value">{date || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="eia-stats-grid">
          <div className="eia-stat-card eia-stat-present">
            <div className="eia-stat-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{presentCount}</div>
              <div className="eia-stat-label">Present</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-absent">
            <div className="eia-stat-icon">
              <i className="bi bi-x-circle"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{absentCount}</div>
              <div className="eia-stat-label">Absent</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-total">
            <div className="eia-stat-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{totalCount}</div>
              <div className="eia-stat-label">Total</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-percentage">
            <div className="eia-stat-icon">
              <i className="bi bi-percent"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{attendancePercentage}%</div>
              <div className="eia-stat-label">Attendance</div>
            </div>
          </div>
        </div>

        <div className="eia-form">
          <div className="eia-section-header">
            <h3>Mark Student Attendance</h3>
            <span className="eia-section-badge">{totalCount} students</span>
          </div>

          {students.length > 0 ? (
            <div className="eia-students-grid">
              {students.map((student, index) => (
                <div
                  key={`${student.rollId}-${index}`}
                  className={`eia-student-card ${student.attendance === "Present" ? "eia-present" : "eia-absent"}`}
                  onClick={() => toggleAttendance(index)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="eia-student-header">
                    <div className="eia-student-roll">{student.rollId}</div>
                    <button
                      type="button"
                      className={`status-pill status-toggle ${student.attendance === "Present" ? "present" : "absent"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleAttendance(index);
                      }}
                    >
                      {student.attendance}
                    </button>
                  </div>
                  <div className="eia-student-name">{student.name}</div>
                  <div className="eia-student-meta">
                    Enrollment: {student.enrollmentNo}
                  </div>
                  <div className="eia-student-meta">Batch: {student.batch}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="eia-no-students">
              <i className="bi bi-inbox"></i>
              <p>No students found for this division.</p>
            </div>
          )}

          <div className="eia-actions">
            <button
              type="button"
              className="eia-button eia-button-secondary"
              onClick={handleExport}
              disabled={students.length === 0 || isSubmitting}
            >
              Export
            </button>
            <button
              type="button"
              className="eia-button eia-button-primary"
              onClick={handleSubmit}
              disabled={students.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
