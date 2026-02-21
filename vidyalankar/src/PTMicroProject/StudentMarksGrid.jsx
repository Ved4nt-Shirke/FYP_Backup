import React, { useState, useEffect } from 'react';
import './StudentMarksGrid.css';

const StudentMarksGrid = ({
  students,
  maxMarks,
  activityType,
  onSaveMarks,
  loading,
  submission = {},
  courseId = ''
}) => {
  const [studentMarks, setStudentMarks] = useState({});
  const [savingStates, setSavingStates] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);

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
        initialMarks[student._id] = studentMarks[student._id] || '';
      }
    });
    setStudentMarks(initialMarks);
  }, [students, submission]);

  const handleMarksChange = (studentId, value) => {
    // The number input already validates min/max, so just update state
    setStudentMarks({ ...studentMarks, [studentId]: value });
  };

  const handleSaveStudentMarks = async (student) => {
    const marks = studentMarks[student._id];

    if (marks === '' || marks === undefined) {
      alert('Please enter marks for this student');
      return;
    }

    setSavingStates({ ...savingStates, [student._id]: true });

    try {
      const marksData = {
        studentId: student._id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        activityType,
        marks: parseInt(marks, 10),
        maxMarks: maxMarks,
        institution: localStorage.getItem('college') || ''
      };
      
      // Add optional fields if available
      if (courseId) marksData.courseId = courseId;
      
      const result = await onSaveMarks(marksData);
      if (!result || !result.success) {
        throw new Error('Failed to save marks - please try again');
      }
    } catch (err) {
      console.error('Error saving marks:', err);
      alert('Error saving marks: ' + err.message);
    } finally {
      setSavingStates({ ...savingStates, [student._id]: false });
    }
  };

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
          <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
          <p className="text-muted mt-3">No students found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-marks-grid-container">
      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="bi bi-people-fill me-2"></i>
            Student Marks Entry - Out of {maxMarks}
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4">
            Enter marks for each student (0 to {maxMarks}). Click "Save" to save marks for individual student.
          </p>

          <div className="students-series">
            {students.map((student, index) => (
              <div key={student._id} className="student-entry-card">
                <div className="student-info">
                  <div className="student-number">#{index + 1}</div>
                  <div className="student-details">
                    <div className="student-name">{student.studentName}</div>
                    <div className="student-roll">Roll No: {student.rollNo}</div>
                  </div>
                </div>

                <div className="marks-input-section">
                  <div className="marks-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      className="form-control marks-input"
                      placeholder={`0-${maxMarks}`}
                      value={studentMarks[student._id] || ''}
                      onChange={(e) => {
                        handleMarksChange(student._id, e.target.value);
                      }}
                      disabled={savingStates[student._id]}
                      autoComplete="off"
                    />
                    <span className="marks-max-label">
                      /{maxMarks}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-success marks-save-btn"
                    onClick={() => handleSaveStudentMarks(student)}
                    disabled={
                      (studentMarks[student._id] === '' || studentMarks[student._id] === undefined) ||
                      savingStates[student._id]
                    }
                  >
                    {savingStates[student._id] ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-light border rounded">
            <small className="text-muted">
              <i className="bi bi-info-circle me-2"></i>
              Total Students: <strong>{students.length}</strong> | Maximum Marks: <strong>{maxMarks}</strong>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMarksGrid;
