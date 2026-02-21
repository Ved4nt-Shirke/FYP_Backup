import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./ViewStudentResponses.css";

const ViewStudentResponses = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marksInput, setMarksInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSubmissions();
  }, [examId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions || []);
        // Try to fetch exam details if available
        fetchExamDetails();
      } else {
        setError(data.message || "Failed to load submissions");
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetails = async () => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setExamTitle(data.practicalExam.title);
      }
    } catch (err) {
      console.error("Error fetching exam details:", err);
    }
  };

  const handleViewFile = async (submission) => {
    try {
      // Open file in new tab
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/${submission._id}/preview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        alert("Failed to open file");
      }
    } catch (err) {
      console.error("Error viewing file:", err);
      alert("Failed to open file");
    }
  };

  const handleDownloadFile = async (submission) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/${submission._id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = submission.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download file");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Failed to download file");
    }
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setMarksInput(submission.marks !== null ? submission.marks : "");
    setFeedbackInput(submission.feedback || "");
  };

  const handleSaveMarksAndFeedback = async () => {
    if (!selectedSubmission) return;

    try {
      setUpdatingId(selectedSubmission._id);

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/${selectedSubmission._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            marks:
              marksInput !== "" ? parseFloat(marksInput) : selectedSubmission.marks,
            feedback: feedbackInput,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update submissions list
        setSubmissions(
          submissions.map((sub) =>
            sub._id === selectedSubmission._id
              ? {
                  ...sub,
                  marks: marksInput !== "" ? parseFloat(marksInput) : sub.marks,
                  feedback: feedbackInput,
                }
              : sub
          )
        );
        setSelectedSubmission(null);
        setMarksInput("");
        setFeedbackInput("");
        alert("Marks and feedback saved successfully");
      } else {
        setError(data.message || "Failed to save marks and feedback");
      }
    } catch (err) {
      console.error("Error saving marks:", err);
      setError("Failed to save marks and feedback");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/${submissionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubmissions(
          submissions.filter((sub) => sub._id !== submissionId)
        );
        if (selectedSubmission?._id === submissionId) {
          setSelectedSubmission(null);
        }
        alert("Submission deleted successfully");
      } else {
        setError(data.message || "Failed to delete submission");
      }
    } catch (err) {
      console.error("Error deleting submission:", err);
      setError("Failed to delete submission");
    }
  };

  if (loading) {
    return (
      <div className="view-responses-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-responses-container">
      <div className="responses-header">
        <button
          className="btn-back"
          onClick={() => navigate("/faculty/practical-exams/manage")}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <div>
          <h1 className="page-title">Student Practical Responses</h1>
          {examTitle && <p className="exam-title">Exam: {examTitle}</p>}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="responses-content">
        <div className="submissions-list">
          {submissions.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>No submissions yet</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Division</th>
                    <th>File</th>
                    <th>Submitted At</th>
                    <th>Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className={
                        selectedSubmission?._id === submission._id
                          ? "selected"
                          : ""
                      }
                    >
                      <td>{index + 1}</td>
                      <td className="student-name">
                        {submission.studentName}
                      </td>
                      <td>{submission.studentRollNo}</td>
                      <td>{submission.division}</td>
                      <td>
                        <span className="file-badge">
                          {submission.fileType.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td>
                        {submission.marks !== null
                          ? submission.marks
                          : "Not graded"}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-icon btn-view"
                          title="View File"
                          onClick={() => handleViewFile(submission)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn-icon btn-download"
                          title="Download"
                          onClick={() => handleDownloadFile(submission)}
                        >
                          <i className="bi bi-download"></i>
                        </button>
                        <button
                          className="btn-icon btn-select"
                          title={
                            selectedSubmission?._id === submission._id
                              ? "Deselect"
                              : "Select"
                          }
                          onClick={() =>
                            selectedSubmission?._id === submission._id
                              ? setSelectedSubmission(null)
                              : handleSelectSubmission(submission)
                          }
                        >
                          <i
                            className={`bi bi-${selectedSubmission?._id === submission._id ? "check" : "square"}`}
                          ></i>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          title="Delete"
                          onClick={() =>
                            handleDeleteSubmission(submission._id)
                          }
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedSubmission && (
          <div className="submission-details">
            <div className="details-header">
              <h3>Grade Submission</h3>
              <button
                className="btn-close"
                onClick={() => setSelectedSubmission(null)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="details-content">
              <div className="student-info">
                <div className="info-row">
                  <label>Student Name:</label>
                  <span>{selectedSubmission.studentName}</span>
                </div>
                <div className="info-row">
                  <label>Roll No:</label>
                  <span>{selectedSubmission.studentRollNo}</span>
                </div>
                <div className="info-row">
                  <label>Division:</label>
                  <span>{selectedSubmission.division}</span>
                </div>
                <div className="info-row">
                  <label>File:</label>
                  <span>{selectedSubmission.fileName}</span>
                </div>
                <div className="info-row">
                  <label>Submitted:</label>
                  <span>
                    {new Date(selectedSubmission.submittedAt).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="marks">Marks</label>
                <input
                  type="number"
                  id="marks"
                  className="form-input"
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  placeholder="Enter marks"
                  disabled={updatingId === selectedSubmission._id}
                />
              </div>

              <div className="form-group">
                <label htmlFor="feedback">Feedback</label>
                <textarea
                  id="feedback"
                  className="form-textarea"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Enter feedback for the student"
                  rows="4"
                  disabled={updatingId === selectedSubmission._id}
                ></textarea>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveMarksAndFeedback}
                  disabled={updatingId === selectedSubmission._id}
                >
                  {updatingId === selectedSubmission._id ? (
                    <>
                      <i className="bi bi-hourglass-split"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle"></i> Save Marks &
                      Feedback
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedSubmission(null)}
                  disabled={updatingId === selectedSubmission._id}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStudentResponses;
