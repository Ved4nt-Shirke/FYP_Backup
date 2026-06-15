import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./PracticalFinalAtt.css";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const handleSelectAll = (value) => {
    const updated = {};
    students.forEach((student) => {
      updated[student.rollNo] = value;
    });
    setAttendance(updated);
  };

  const handleToggleAll = () => {
    const updated = {};
    students.forEach((student) => {
      updated[student.rollNo] = !attendance[student.rollNo];
    });
    setAttendance(updated);
  };

  const handleReset = () => {
    const updated = {};
    students.forEach((student) => {
      updated[student.rollNo] = false;
    });
    setAttendance(updated);
  };

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

        <div className="practical-bulk-actions">
          <button
            type="button"
            className="practical-action-btn"
            onClick={() => handleSelectAll(true)}
          >
            Mark All Present
          </button>
          <button
            type="button"
            className="practical-action-btn"
            onClick={() => handleSelectAll(false)}
          >
            Mark All Absent
          </button>
          <button
            type="button"
            className="practical-action-btn"
            onClick={handleToggleAll}
          >
            Toggle All
          </button>
          <button
            type="button"
            className="practical-action-btn ghost"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <div className="practical-filter-panel">
          <label htmlFor="batch-filter" className="practical-filter-label">
            Filter by Academic Year Batch:
          </label>
          <select
            id="batch-filter"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="practical-filter-select"
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

        <div className="practical-toolbar">
          <input
            type="text"
            className="practical-search"
            placeholder="Search by roll, name, enrollment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="practical-filter-chips">
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "present" ? "active" : ""}`}
              onClick={() => setStatusFilter("present")}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              className={`practical-filter-chip ${statusFilter === "absent" ? "active" : ""}`}
              onClick={() => setStatusFilter("absent")}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>

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
            ) : students.length === 0 ? (
              <div className="practical-empty">
                <h4>No students found for this batch.</h4>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="practical-empty">
                <h4>No students match the selected filter.</h4>
              </div>
            ) : (
              <div className="practical-students-grid">
                {filteredStudents.map((student) => (
                  <div
                    key={student.rollNo}
                    className={`practical-student-card ${attendance[student.rollNo] ? "present" : "absent"}`}
                    onClick={() => {
                      setAttendance((prev) => ({
                        ...prev,
                        [student.rollNo]: !prev[student.rollNo],
                      }));
                    }}
                  >
                    <div className="practical-student-header">
                      <span className="practical-roll-badge">
                        {student.rollNo}
                      </span>
                      <button
                        type="button"
                        className={`attendance-toggle ${attendance[student.rollNo] ? "present" : "absent"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setAttendance((prev) => ({
                            ...prev,
                            [student.rollNo]: !prev[student.rollNo],
                          }));
                        }}
                      >
                        {attendance[student.rollNo] ? "Present" : "Absent"}
                      </button>
                    </div>
                    <div className="practical-student-name">
                      {student.studentName}
                    </div>
                    <div className="practical-student-meta">
                      Enrollment: {student.enrollmentNo || "N/A"}
                    </div>
                    <div className="practical-student-meta">
                      Batch: {student.batch || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {submitError && students.length > 0 && (
          <div className="practical-error">{submitError}</div>
        )}

        <div className="practical-pagination practical-pagination--submit">
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
