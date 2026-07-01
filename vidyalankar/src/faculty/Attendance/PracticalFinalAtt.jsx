import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./PracticalFinalAtt.css";

const PracticalFinalAtt = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    CiaanId,
    weekNo,
    batch,
    exptNo,
    exptName,
    actualDate,
    remark,
    CiaanData,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Map lab-plan batch codes (B1/B2/B3) to student batch field values (Batch 1/Batch 2/Batch 3)
  const labBatchToStudentBatch = (labBatch) => {
    const map = { B1: "Batch 1", B2: "Batch 2", B3: "Batch 3" };
    return map[labBatch] || labBatch;
  };

  useEffect(() => {
    if (!CiaanId || !weekNo || !batch || !exptNo) {
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

    // Map the lab-plan batch code (e.g. "B1") to the student batch value (e.g. "Batch 1")
    // and pass it as a filter so only students belonging to this batch are returned
    const studentBatchValue = labBatchToStudentBatch(batch);
    params.batch = studentBatchValue;

    axios
      .get(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/students`, { params })
      .then((res) => {
        const batchStudents = Array.isArray(res.data)
          ? res.data
          : res.data.students || [];

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
  }, [CiaanId, weekNo, batch, exptNo, CiaanData]);

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the attendance?")) {
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    const attendanceData = {
      CiaanId,
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
      // Step 1: Submit student-level attendance
      await axios.post(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/practical-attendance`,
        attendanceData,
      );

      // Step 2: Only NOW mark the lab plan experiment as completed (sets actualDate)
      // This is what makes the row show "Completed" and locks the Mark button
      try {
        await axios.put(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/lab-planning/${CiaanId}/${weekNo}/${batch}/${exptNo}`,
          { actualDate, remark },
        );
      } catch (labErr) {
        // Non-critical: attendance is already saved even if lab plan update fails
        console.warn("Could not update lab plan actualDate:", labErr.message);
      }

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

  if (!CiaanId || !weekNo || !batch || !exptNo) {
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
              {CiaanData?.subject?.name} - Experiment {exptNo}
            </p>
          </div>
          <div className="practical-header-meta">
            <div>
              <span>Division</span>
              <strong>{CiaanData?.division || "N/A"}</strong>
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
            <div className="practical-badge">CIAAN ID {CiaanId}</div>
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
