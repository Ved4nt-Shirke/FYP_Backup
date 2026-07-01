import React, { useState, useEffect } from "react";
import "./StudentMarksGrid.css";

const StudentMarksGrid = ({
  students,
  maxMarks,
  activityType,
  onSaveMarks,
  onBulkSaveComplete,
  loading,
  submission = {},
  courseId = "",
}) => {
  const [studentMarks, setStudentMarks] = useState({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  useEffect(() => {
    // Initialize/update student marks from existing submission data
    const hasSubmission = submission && Object.keys(submission).length > 0;
    if (!hasSubmission && Object.keys(studentMarks).length > 0) {
      return;
    }

    const initialMarks = {};
    students.forEach((student) => {
      if (submission[student._id] !== undefined) {
        initialMarks[student._id] = submission[student._id];
      } else {
        initialMarks[student._id] = studentMarks[student._id] || "";
      }
    });
    setStudentMarks(initialMarks);
  }, [students, submission]);

  const handleMarksChange = (studentId, value) => {
    // The number input already validates min/max, so just update state
    setStudentMarks({ ...studentMarks, [studentId]: value });
  };

  const handleSaveAllMarks = async () => {
    const enteredEntries = students.filter((student) => {
      const rawMarks = studentMarks[student._id];
      return rawMarks !== "" && rawMarks !== undefined;
    });

    if (enteredEntries.length === 0) {
      alert("Please enter marks for at least one student before saving.");
      return;
    }

    const invalidEntries = enteredEntries.filter((student) => {
      const rawMarks = studentMarks[student._id];
      const numericMarks = Number(rawMarks);
      return (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > Number(maxMarks)
      );
    });

    if (invalidEntries.length > 0) {
      alert(
        `Please enter valid marks (0-${maxMarks}) for all entered rows before saving.`,
      );
      return;
    }

    setIsSavingAll(true);

    try {
      for (const student of enteredEntries) {
        const marksData = {
          studentId: student._id,
          studentName: student.studentName,
          rollNo: student.rollNo,
          activityType,
          marks: parseInt(studentMarks[student._id], 10),
          maxMarks,
          institution: localStorage.getItem("college") || "",
        };

        if (courseId) marksData.courseId = courseId;

        const result = await onSaveMarks(marksData);
        if (!result || !result.success) {
          throw new Error(`Failed to save marks for ${student.studentName}`);
        }
      }

      if (onBulkSaveComplete) {
        onBulkSaveComplete(enteredEntries.length);
      }
    } catch (err) {
      console.error("Error saving marks:", err);
      alert("Error saving marks: " + err.message);
    } finally {
      setIsSavingAll(false);
    }
  };

  const filledCount = students.filter((student) => {
    const value = studentMarks[student._id];
    return value !== "" && value !== undefined;
  }).length;

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading students...</p>
        </div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i
            className="bi bi-inbox"
            style={{ fontSize: "3rem", color: "#ccc" }}
          ></i>
          <p className="text-muted mt-3">No students found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-marks-grid-container">
      <div className="card ptm-marks-card">
        <div className="card-header ptm-marks-header">
          <h5 className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            Student Marks Entry - Out of {maxMarks}
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4">
            Enter marks for each student (0 to {maxMarks}), then use one final
            save button.
          </p>

          <div className="students-series">
            {students.map((student, index) => (
              <div key={student._id} className="student-entry-card">
                <div className="student-info">
                  <div className="student-number">#{index + 1}</div>
                  <div className="student-details">
                    <div className="student-name">{student.studentName}</div>
                    <div className="student-roll">
                      Roll No: {student.rollNo}
                    </div>
                  </div>
                  {submission[student._id] !== undefined && (
                    <span className="ptm-saved-pill">
                      <i className="bi bi-check2-circle"></i> Saved
                    </span>
                  )}
                </div>

                <div className="marks-input-section">
                  <div className="marks-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      className="form-control marks-input"
                      placeholder={`0-${maxMarks}`}
                      value={studentMarks[student._id] || ""}
                      onChange={(e) => {
                        handleMarksChange(student._id, e.target.value);
                      }}
                      disabled={isSavingAll}
                      autoComplete="off"
                    />
                    <span className="marks-max-label">/{maxMarks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ptm-grid-footer mt-4">
            <small className="text-muted">
              <i className="bi bi-info-circle me-2"></i>
              Filled:{" "}
              <strong>
                {filledCount}/{students.length}
              </strong>{" "}
              | Maximum Marks: <strong>{maxMarks}</strong>
            </small>
            <button
              type="button"
              className="btn ptm-save-all-btn"
              onClick={handleSaveAllMarks}
              disabled={isSavingAll || students.length === 0}
            >
              {isSavingAll ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Saving All...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up me-2"></i>
                  Save All Marks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMarksGrid;
