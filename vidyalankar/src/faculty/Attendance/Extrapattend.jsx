import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { showErrorAlert } from "../../utils/alertUtils.jsx";
import "./edit/EditIndividualAttendance.css";

const StudentAttendancePage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const metaString = localStorage.getItem("attendanceMeta");

    if (!metaString) {
      showErrorAlert("Missing attendance information. Redirecting to form...");
      navigate("/extra-practical");
      return;
    }

    let meta;
    try {
      meta = JSON.parse(metaString);
    } catch (parseError) {
      console.error("Error parsing localStorage data:", parseError);
      showErrorAlert(
        "Invalid attendance data. Please go back and fill the form again.",
      );
      return;
    }

    if (!meta || !meta.batch) {
      showErrorAlert(
        "Missing batch information. Please go back and select a batch.",
      );
      return;
    }

    const params = { batch: meta.batch };
    if (meta.ciannData?.division) {
      params.division = meta.ciannData.division;
    }

    axios
      .get("http://localhost:5000/api/students", { params })
      .then((res) => {
        if (!res.data || res.data.length === 0) {
          return axios.get("http://localhost:5000/api/students");
        }

        const studentList = res.data.map((student) => ({
          rollId: student.rollNo,
          name: student.studentName,
          enrollmentNo: student.enrollmentNo || "N/A",
          batch: student.batch || "N/A",
          attendance: "Absent",
        }));
        setStudents(studentList);
        return null;
      })
      .then((fallbackRes) => {
        if (fallbackRes) {
          const filteredStudents = fallbackRes.data.filter(
            (student) => student.batch === meta.batch,
          );

          if (filteredStudents.length === 0) {
            setStudents([]);
            setIsSuccess(false);
            setMessage(
              `No students found for batch ${meta.batch}. Please add students to this batch first.`,
            );
            return;
          }

          const studentList = filteredStudents.map((student) => ({
            rollId: student.rollNo,
            name: student.studentName,
            enrollmentNo: student.enrollmentNo || "N/A",
            batch: student.batch || "N/A",
            attendance: "Absent",
          }));
          setStudents(studentList);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch students:", err);
        setStudents([]);
        setIsSuccess(false);
        setMessage(
          `Failed to fetch students: ${err.response?.data?.message || err.message}`,
        );
      });
  }, [navigate]);

  const toggleAttendance = (index) => {
    setStudents((prevStudents) => {
      const updated = prevStudents.map((student, i) =>
        i === index
          ? {
              ...student,
              attendance:
                student.attendance === "Present" ? "Absent" : "Present",
            }
          : student,
      );
      return updated;
    });
  };

  const handleSubmitAttendance = async () => {
    try {
      const meta = JSON.parse(localStorage.getItem("attendanceMeta"));
      if (!meta) {
        setIsSuccess(false);
        setMessage("Missing attendance meta info.");
        return;
      }

      const ciannData = meta.ciannData;
      if (!ciannData) {
        setIsSuccess(false);
        setMessage("Missing CIANN data. Please select a CIANN first.");
        return;
      }

      if (!ciannData.ciannId) {
        setIsSuccess(false);
        setMessage("Missing CIANN ID. Please select a valid CIANN.");
        return;
      }

      if (students.length === 0) {
        setIsSuccess(false);
        setMessage("No students found. Please refresh and try again.");
        return;
      }

      const payload = {
        ...meta,
        students,
        ciannId: ciannData.ciannId,
      };

      setIsSubmitting(true);
      setMessage("");

      await axios.post("http://localhost:5000/api/extra-pract", payload);

      setIsSuccess(true);
      setMessage("Extra practical attendance submitted successfully.");
      localStorage.removeItem("attendanceMeta");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSuccess(false);
      setMessage(
        `Submission failed: ${err.response?.data?.message || err.message}`,
      );
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

  const metaString = localStorage.getItem("attendanceMeta");
  let meta = null;
  try {
    meta = metaString ? JSON.parse(metaString) : null;
  } catch (err) {
    console.error("Error parsing metadata:", err);
  }

  const ciannData = meta?.ciannData;

  return (
    <div className="eia-page">
      <div className="eia-hero">
        <h1 className="eia-hero-title">Mark Extra Practical Attendance</h1>
        <p className="eia-hero-subtitle">
          {ciannData?.subject?.name || "Extra Practical Session"}
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
            <span>Extra Practical Context</span>
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
              <span className="eia-context-label">Batch</span>
              <span className="eia-context-value">{meta?.batch || "N/A"}</span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Experiments</span>
              <span className="eia-context-value">
                {meta?.experiments || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Date</span>
              <span className="eia-context-value">
                {meta?.actualDate || "N/A"}
              </span>
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
              <p>No students found for this batch and division.</p>
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
              onClick={handleSubmitAttendance}
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

export default StudentAttendancePage;
