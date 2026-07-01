import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/mockExam.css";

const MockExamResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result || null;
  const exam = location.state?.exam || null;

  if (!result) {
    return (
      <div className="mock-exam-shell">
        <div className="mock-exam-page">
          <h1 className="mock-exam-title">Result Not Loaded</h1>
          <p className="mock-exam-subtitle">Open your exam result from a completed submission or view your result history.</p>
          <button className="mock-exam-button" onClick={() => navigate("/mock-exams")}>Back to Exams</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <span className="mock-exam-pill">Submission Complete</span>
        <h1 className="mock-exam-title">{exam?.title || "Mock Exam"}</h1>
        <p className="mock-exam-subtitle">Your attempt has been evaluated successfully.</p>

        <div className="mock-exam-stats">
          <div className="mock-exam-stat"><span>Score</span><strong>{result.score}</strong></div>
          <div className="mock-exam-stat"><span>Correct Answers</span><strong>{result.correctAnswers}</strong></div>
          <div className="mock-exam-stat"><span>Wrong Answers</span><strong>{result.wrongAnswers}</strong></div>
          <div className="mock-exam-stat"><span>Total Marks</span><strong>{result.totalMarks}</strong></div>
          <div className="mock-exam-stat"><span>Percentage</span><strong>{result.percentage}%</strong></div>
          <div className="mock-exam-stat"><span>Time Taken</span><strong>{Math.round((result.timeTaken || 0) / 60)} min</strong></div>
        </div>

        <button className="mock-exam-button secondary" onClick={() => navigate("/mock-exams")}>Back to Exams</button>
      </div>
    </div>
  );
};

export default MockExamResult;