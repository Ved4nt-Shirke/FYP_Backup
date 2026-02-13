// Attendance/PracticalFinalAtt.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./TheoryEdit.css"; // This CSS file contains the styles for the custom checkbox

const PracticalFinalAtt = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract required state params
  const {
    ciannId,
    weekNo,
    batch,
    exptNo,
    exptName,
    actualDate,
    remark,
  } = location.state || {};

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Fetch students from backend filtered by batch
  useEffect(() => {
    if (!ciannId || !weekNo || !batch || !exptNo) {
      setIsLoading(false);
      return;
    }
    
    axios
      .get("http://localhost:5000/api/students", { params: { batch } })
      .then((res) => {
        setStudents(res.data);
        // Default all to absent (unchecked)
        const initAttendance = {};
        res.data.forEach((stu) => {
          initAttendance[stu.rollNo] = false;
        });
        setAttendance(initAttendance);
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setSubmitError("Failed to fetch students. Please try again.");
      })
      .finally(() => setIsLoading(false));
  }, [ciannId, weekNo, batch, exptNo]);

  const handleCheckboxChange = (rollNo) => {
    setAttendance((prev) => ({
      ...prev,
      [rollNo]: !prev[rollNo],
    }));
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the attendance?")) return;

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
      await axios.post("http://localhost:5000/api/practical-attendance", attendanceData);
      alert("Attendance submitted successfully!");
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to submit attendance. Please try again."
      );
      console.error("Error submitting attendance:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!ciannId || !weekNo || !batch || !exptNo) {
    return (
      <div className="timetable-main-content">
        <div className="theory-attendance-container">
          <h3 style={{ color: "red" }}>
            Error: Missing required data (CIAAN ID, week, batch or experiment)
          </h3>
          <p>
            <strong>Debug Info:</strong>
            <br />
            CIAAN ID: {ciannId || "Missing"}
            <br />
            Week No: {weekNo || "Missing"}
            <br />
            Batch: {batch || "Missing"}
            <br />
            Experiment No: {exptNo || "Missing"}
          </p>
          <button className="submit-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-main-content">
      <div className="theory-attendance-container">
        <div className="header-row">
          <h3>Practical Attendance &mdash; {exptName} (Exp. No: {exptNo})</h3>
        </div>
        <div className="toolbar">
          <p><strong>CIAAN ID:</strong> {ciannId}</p>
          <p><strong>Week:</strong> {weekNo}</p>
          <p><strong>Batch:</strong> {batch}</p>
          <p><strong>Date:</strong> {actualDate}</p>
          {remark && <p><strong>Remark:</strong> {remark}</p>}
        </div>

        {isLoading ? (
          <div className="loading-spinner">Loading student list...</div>
        ) : submitError && !students.length ? (
          <div style={{ color: "red", marginTop: 20 }}>
            <p>{submitError}</p>
            <button className="submit-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <>
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
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center" }}>
                        No students found for this batch.
                      </td>
                    </tr>
                  )}
                  {students.map((student) => (
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
            {submitError && (
              <div style={{ color: "red", marginTop: 12, textAlign: 'center' }}>{submitError}</div>
            )}
            <div className="submit-wrapper">
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={submitLoading || students.length === 0}
              >
                {submitLoading ? "Submitting..." : "Submit Attendance"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PracticalFinalAtt;
