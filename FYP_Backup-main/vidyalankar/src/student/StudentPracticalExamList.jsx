import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./StudentPracticalExamList.css";

const StudentPracticalExamList = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Your session has expired. Please log in again.");
        setExams([]);
        return;
      }

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/submissions/available-exams`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        setExams([]);
        return;
      }

      if (data.success) {
        setExams(data.exams || []);
      } else {
        setError(data.message || "Failed to load exams");
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAnswer = (examId) => {
    navigate(`/practical-exam-upload/${examId}`);
  };

  if (loading) {
    return (
      <div className="practical-exams-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading practical exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="practical-exams-container">
      <div className="exams-header">
        <div>
          <h2>Practical Exams</h2>
          <p>Submit your answers for the assigned practical exams</p>
        </div>
        <button className="btn btn-outline" onClick={fetchAvailableExams}>
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <div className="student-exam-summary">
        <div className="summary-card">
          <span className="summary-label">Available Exams</span>
          <span className="summary-value">{exams.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Marks</span>
          <span className="summary-value">
            {exams.reduce((sum, exam) => sum + Number(exam.totalMarks || 0), 0)}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
      )}

      {exams.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No practical exams assigned to your division</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <div className="card-header">
                <h3>{exam.title}</h3>
                <span className="marks-badge">{exam.totalMarks} Marks</span>
              </div>

              <div className="card-body">
                <div className="exam-info">
                  <div className="info-row">
                    <span className="label">Duration:</span>
                    <span className="value">{exam.duration} minutes</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Marks:</span>
                    <span className="value">{exam.totalMarks}</span>
                  </div>
                  {exam.divisions && (
                    <div className="info-row">
                      <span className="label">For Division:</span>
                      <span className="value">
                        {exam.divisions.join(", ")}
                      </span>
                    </div>
                  )}
                  {exam.batch && (
                    <div className="info-row">
                      <span className="label">Batch:</span>
                      <span className="value">{exam.batch}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUploadAnswer(exam._id)}
                  >
                    <i className="bi bi-cloud-upload"></i> Upload Answer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentPracticalExamList;
