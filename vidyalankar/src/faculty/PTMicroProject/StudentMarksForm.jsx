import React, { useState, useEffect } from 'react';
import MarksDropdown from './MarksDropdown';

const StudentMarksForm = ({
  activityType,
  students,
  onSubmit,
  loading,
  existingMarksData
}) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMarks, setSelectedMarks] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Reset form when activity type changes
    setSelectedStudent('');
    setSelectedMarks(null);
    setFeedback('');
    setError('');
    setSuccess('');
  }, [activityType]);

  useEffect(() => {
    // Populate form if editing existing marks
    if (existingMarksData) {
      setSelectedStudent(existingMarksData.studentId?._id || existingMarksData.studentId);
      setSelectedMarks(existingMarksData.marks);
      setFeedback(existingMarksData.feedback || '');
    }
  }, [existingMarksData]);

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
    setError('');
    setSuccess('');

    // Load existing marks for selected student if available
    const student = students.find(s => s._id === e.target.value);
    if (student) {
      // You can fetch existing marks here if needed
      setSelectedMarks(null);
      setFeedback('');
    }
  };

  const handleSubmitMarks = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    if (selectedMarks === null || selectedMarks === undefined) {
      setError('Please select marks');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const student = students.find(s => s._id === selectedStudent);

      const payload = {
        studentId: selectedStudent,
        studentName: student?.studentName || '',
        rollNo: student?.rollNo || '',
        activityType,
        marks: parseInt(selectedMarks, 10),
        feedback: feedback.trim() || '',
        institution: localStorage.getItem('college') || ''
      };

      await onSubmit(payload);

      setSuccess('Marks saved successfully!');
      setSelectedStudent('');
      setSelectedMarks(null);
      setFeedback('');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Error saving marks');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-pencil-square me-2"></i>
          Enter Marks - {activityType}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmitMarks}>
          {/* Student Selection */}
          <div className="mb-4">
            <label htmlFor="studentSelect" className="form-label fw-bold">
              Select Student
            </label>
            <select
              id="studentSelect"
              className="form-select form-select-lg"
              value={selectedStudent}
              onChange={handleStudentChange}
              disabled={submitting}
            >
              <option value="">-- Choose a Student --</option>
              {students && students.length > 0 ? (
                students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.studentName} (Roll No: {student.rollNo})
                  </option>
                ))
              ) : (
                <option disabled>No students found</option>
              )}
            </select>
            <small className="text-muted d-block mt-1">
              Total students: {students?.length || 0}
            </small>
          </div>

          {/* Marks Selection */}
          <div className="mb-4">
            <MarksDropdown
              selectedMarks={selectedMarks}
              onSelect={setSelectedMarks}
            />
          </div>

          {/* Feedback (Optional) */}
          <div className="mb-4">
            <label htmlFor="feedback" className="form-label fw-bold">
              Feedback (Optional)
            </label>
            <textarea
              id="feedback"
              className="form-control"
              rows="3"
              placeholder="Enter any feedback for the student"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={submitting}
            ></textarea>
            <small className="text-muted d-block mt-1">
              Maximum 500 characters
            </small>
          </div>

          {/* Submit Button */}
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-success btn-lg"
              disabled={submitting || !selectedStudent || selectedMarks === null}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Save Marks
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMarksForm;
