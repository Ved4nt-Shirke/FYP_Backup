import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { config } from "../config/api";
import "./PublicPracticalExam.css";

const PublicPracticalExam = () => {
  const { publicLink } = useParams();
  const [exam, setExam] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRandomQuestion();
  }, [publicLink]);

  const fetchRandomQuestion = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch random question
      const endpoint = `${config.apiBaseUrl}/practical-exams/public/random-question/${publicLink}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setExam(data.exam);
        setQuestion(data.question);
      } else {
        setError(data.message || "Exam not found or not available");
      }
    } catch (err) {
      console.error("Error fetching exam:", err);
      setError("Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="public-exam-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-exam-container">
        <div className="error-state">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <h2>Unable to Load Exam</h2>
          <p>{error}</p>
          <p className="error-hint">
            Please check the link and try again. If the problem persists,
            contact your instructor.
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !question) {
    return (
      <div className="public-exam-container">
        <div className="error-state">
          <h2>No Question Available</h2>
          <p>
            This exam doesn't have any questions yet. Please contact your
            instructor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-exam-container">
      <div className="exam-wrapper">
        {/* Course Header - Simple */}
        <div className="simple-header">
          <p className="course-info">
            <span className="course-code">{exam.courseCode}</span>
            <span className="course-name">{exam.courseName}</span>
          </p>
        </div>

        {/* Question Display - Simple */}
        <div className="question-display">
          <div className="question-content">
            <div className="question-text">
              <p>{question.questionText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPracticalExam;
