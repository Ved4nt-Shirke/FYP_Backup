import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./StudentPracticalExamUpload.css";

const StudentPracticalExamUpload = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assignedQuestion, setAssignedQuestion] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/exam/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setExam(data.exam);
        setAssignedQuestion(data.assignedQuestion || null);
        setExistingSubmission(data.submission || null);
      } else {
        setError(data.message || "Failed to load exam details");
      }
    } catch (err) {
      console.error("Error fetching exam:", err);
      setError("Failed to load exam details");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF and DOCX files are allowed");
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("submission", file);
      formData.append("examId", examId);

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Answer submitted successfully!");
        navigate("/practical-exams");
      } else {
        setError(data.message || "Failed to submit answer");
      }
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Failed to submit answer");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="upload-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="upload-container">
        <div className="error-state">
          <i className="bi bi-exclamation-circle"></i>
          <p>Exam not found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/practical-exams")}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div className="upload-wrapper">
        <div className="upload-header">
          <button
            className="btn-back"
            onClick={() => navigate("/practical-exams")}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>
          <h1 className="page-title">Submit Answer</h1>
        </div>

        <div className="upload-content">
          <div className="exam-details">
            <h2>{exam.title}</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Total Marks:</span>
                <span className="detail-value">{exam.totalMarks}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{exam.duration} minutes</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Batch:</span>
                <span className="detail-value">{exam.batch}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Divisions:</span>
                <span className="detail-value">
                  {exam.divisions.join(", ")}
                </span>
              </div>
            </div>

            {exam.description && (
              <div className="exam-description">
                <h3>Description</h3>
                <p>{exam.description}</p>
              </div>
            )}

            <div className="exam-questions">
              <h3>Your Assigned Question</h3>
              {assignedQuestion ? (
                <div className="question-item single-question">
                  <div className="question-number">Q{assignedQuestion.questionNumber}</div>
                  <div className="question-details">
                    <p className="question-text">{assignedQuestion.questionText}</p>
                    <div className="question-meta">
                      <span className="marks">
                        <i className="bi bi-star-fill"></i> {assignedQuestion.marks || 0} marks
                      </span>
                      <span
                        className="difficulty"
                        data-difficulty={String(assignedQuestion.difficulty || "medium").toLowerCase()}
                      >
                        {assignedQuestion.difficulty || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="question-empty">
                  Faculty has not added questions for this exam yet.
                </div>
              )}
            </div>

            {existingSubmission && (
              <div className="existing-submission-note">
                <i className="bi bi-check-circle-fill"></i>
                You already submitted: <strong>{existingSubmission.fileName}</strong>. Uploading again will replace it.
              </div>
            )}
          </div>

          <div className="upload-form-section">
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-title">Upload Your Answer</div>

              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </div>
              )}

              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <div className="file-icon">
                    <i className="bi bi-cloud-upload"></i>
                  </div>
                  <div className="file-text">
                    <p className="file-title">Click to upload or drag and drop</p>
                    <p className="file-subtitle">
                      PDF, DOCX (MAX. 50MB)
                    </p>
                  </div>
                </label>
              </div>

              {fileName && (
                <div className="selected-file">
                  <div className="file-info">
                    <i className="bi bi-file-earmark"></i>
                    <span>{fileName}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => {
                      setFile(null);
                      setFileName("");
                    }}
                    disabled={uploading}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-submit"
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <i className="bi bi-hourglass-split"></i> Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload"></i> Submit Answer
                  </>
                )}
              </button>

              <p className="form-note">
                <i className="bi bi-info-circle"></i>
                Make sure your file is properly named and formatted before submission.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPracticalExamUpload;
