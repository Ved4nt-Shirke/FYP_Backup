import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./PracticalAttendance.css";

const PracticalFinalAtt = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    ciannId,
    weekNo,
    batch,
    exptNo,
    exptName,
    actualDate,
    remark,
    ciannData,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  // Generate batch options (academic years)
  const generateBatchOptions = () => {
    const currentYear = new Date().getFullYear();
    const batches = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      batches.push(`${startYear}-${endYear.toString().slice(-2)}`);
    }
    return batches;
  };

  const batchOptions = generateBatchOptions();

  useEffect(() => {
    if (!ciannId || !weekNo || !batch || !exptNo) {
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
    // Use selectedBatch (academic year like 2025-26) for filtering students
    if (selectedBatch) {
      params.batch = selectedBatch;
    }

    axios
      .get("http://localhost:5000/api/students", { params })
      .then((res) => {
        const allStudents = Array.isArray(res.data)
          ? res.data
          : res.data.students || [];

        // Divide students into B1, B2, B3 batches
        const batchSize = Math.ceil(allStudents.length / 3);
        const batches = {
          B1: allStudents.slice(0, batchSize),
          B2: allStudents.slice(batchSize, batchSize * 2),
          B3: allStudents.slice(batchSize * 2),
        };

        // Filter students based on the practical batch (B1, B2, or B3)
        const batchStudents = batches[batch] || allStudents;

        setStudents(batchStudents);
        const initAttendance = {};
        batchStudents.forEach((stu) => {
          initAttendance[stu.rollNo] = false;
        });
        setAttendance(initAttendance);
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setSubmitError("Failed to fetch students. Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, [ciannId, weekNo, batch, exptNo, ciannData, selectedBatch]);

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the attendance?")) {
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    const attendanceData = {
      ciannId,
      weekNo,
      batch,
      exptNo,
      exptName,
      actualDate,
      remark,
      students: students.map((student) => ({
        rollNo: student.rollNo,
        studentName: student.studentName,
        status: attendance[student.rollNo] ? "Present" : "Absent",
      })),
    };

    try {
      await axios.post(
        "http://localhost:5000/api/practical-attendance",
        attendanceData,
      );
      alert("Attendance submitted successfully!");
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to submit attendance. Please try again.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!ciannId || !weekNo || !batch || !exptNo) {
    return (
      <div className="practical-page">
        <div className="practical-card">
          <h2 className="practical-title">Missing data</h2>
          <p className="practical-subtitle">
            CIAAN ID, week, batch, or experiment is missing.
          </p>
          <button className="action-pill" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="practical-page">
      <div className="practical-card">
        <header className="practical-header">
          <div className="practical-header-main">
            <p className="practical-eyebrow">Lab Attendance</p>
            <h2 className="practical-title">Practical Attendance</h2>
            <p className="practical-subtitle">
              {ciannData?.subject?.name} - Experiment {exptNo}
            </p>
          </div>
          <div className="practical-header-meta">
            <div>
              <span>Division</span>
              <strong>{ciannData?.division || "N/A"}</strong>
            </div>
            <div>
              <span>Batch</span>
              <strong>{batch}</strong>
            </div>
            <div>
              <span>Week</span>
              <strong>{weekNo}</strong>
            </div>
          </div>
        </header>

        {/* Batch Filter */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <label
            htmlFor="batch-filter"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            Filter by Academic Year Batch:
          </label>
          <select
            id="batch-filter"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          >
            <option value="">-- All Batches --</option>
            {batchOptions.map((batchYear) => (
              <option key={batchYear} value={batchYear}>
                {batchYear}
              </option>
            ))}
          </select>
        </div>

        <section className="practical-metrics">
          <div className="metric-card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
          <div className="metric-card success">
            <span>Present</span>
            <strong>{presentCount}</strong>
          </div>
          <div className="metric-card warning">
            <span>Absent</span>
            <strong>{absentCount}</strong>
          </div>
        </section>

        <section className="practical-table-section">
          <div className="practical-table-head">
            <div>
              <h3>Student List</h3>
              <p>Mark attendance for {exptName}.</p>
            </div>
            <div className="practical-badge">CIAAN ID {ciannId}</div>
          </div>

          <div className="practical-table-container">
            {isLoading ? (
              <div className="practical-loading">Loading students...</div>
            ) : submitError && !students.length ? (
              <div className="practical-empty">
                <h4>{submitError}</h4>
                <p>Please try again.</p>
              </div>
            ) : (
              <table className="practical-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Enrollment No</th>
                    <th>Batch</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No students found for this batch.</td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.rollNo}>
                        <td>{student.rollNo}</td>
                        <td>{student.studentName}</td>
                        <td>{student.enrollmentNo || "N/A"}</td>
                        <td>{student.batch || "N/A"}</td>
                        <td>
                          <button
                            type="button"
                            className={`attendance-toggle ${
                              attendance[student.rollNo] ? "present" : "absent"
                            }`}
                            onClick={() => {
                              setAttendance((prev) => ({
                                ...prev,
                                [student.rollNo]: !prev[student.rollNo],
                              }));
                            }}
                          >
                            {attendance[student.rollNo] ? "PRESENT" : "ABSENT"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {submitError && students.length > 0 && (
          <div className="practical-error">{submitError}</div>
        )}

        <div className="practical-pagination">
          <button
            className="action-pill"
            onClick={handleSubmit}
            disabled={submitLoading || students.length === 0}
          >
            {submitLoading
              ? "Submitting..."
              : `Submit Attendance (${presentCount}/${students.length} Present)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticalFinalAtt;
