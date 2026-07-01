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
        <div className="mock-exam-page text-center py-5">
          <i className="bi bi-exclamation-circle text-danger mb-3" style={{ fontSize: "3rem" }} />
          <h1 className="mock-exam-title">Result Not Loaded</h1>
          <p className="mock-exam-subtitle">Open your exam result from a completed submission or view your result history.</p>
          <button className="mock-exam-button mt-3" onClick={() => navigate("/mock-exams")}>Back to Exams</button>
        </div>
      </div>
    );
  }

  const percentage = result.percentage || (result.totalMarks ? ((result.score / result.totalMarks) * 100).toFixed(1) : "0.0");
  const timeMin = Math.floor((result.timeTaken || 0) / 60);
  const timeSec = (result.timeTaken || 0) % 60;

  // Check if passed
  const passingMarks = exam?.passingMarks || 18;
  const isPassed = Number(result.score) >= passingMarks;

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        {/* Submission success card */}
        <div className="text-center mb-4 p-4 border rounded-3 bg-light">
          <i className={`bi ${isPassed ? "bi-check-circle-fill text-success" : "bi-exclamation-triangle-fill text-danger"} mb-2`} style={{ fontSize: "3.5rem" }} />
          <span className="mock-exam-pill d-block mx-auto mb-2" style={{ width: "fit-content" }}>Submission Complete</span>
          <h1 className="mock-exam-title text-dark">{exam?.title || "Mock Examination"}</h1>
          <p className="mock-exam-subtitle mb-0">Your exam has been evaluated. Review your performance analytics below.</p>
        </div>

        {/* Analytics stats */}
        <div className="mock-exam-grid cols-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Score Obtained</div>
            <strong style={{ fontSize: "2.2rem", color: isPassed ? "var(--primary-color)" : "#ef4444" }}>
              {result.score} <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#6b7280" }}>/ {result.totalMarks}</span>
            </strong>
            <span className={`badge ${isPassed ? "bg-success" : "bg-danger"} mt-2`}>
              {isPassed ? "PASS" : "FAIL"} (Passing: {passingMarks})
            </span>
          </div>

          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Percentage Score</div>
            <strong style={{ fontSize: "2.2rem", color: "#2563eb" }}>{percentage}%</strong>
            <span className="badge-sec mt-2 d-inline-block">Correct answers: {result.correctAnswers || 0}</span>
          </div>

          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Duration / Time taken</div>
            <strong style={{ fontSize: "2.2rem", color: "#8b5cf6" }}>{timeMin}m {timeSec}s</strong>
            <span className="badge-sec mt-2 d-inline-block">Total Duration: {exam?.duration || 60}m</span>
          </div>
        </div>

        {/* Detailed Question Review Sheet (if answers list exists) */}
        {exam?.questions && Array.isArray(exam.questions) && exam.questions.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <h3 className="mock-exam-card-title mb-3"><i className="bi bi-card-checklist me-1" /> Questions Review Sheet</h3>
            <div className="d-flex flex-column gap-3">
              {exam.questions.map((q, idx) => {
                // Find matching answer submitted
                const studentAnsObj = Array.isArray(result.answers)
                  ? result.answers.find((a) => String(a.questionId) === String(q._id))
                  : null;

                const answerText = studentAnsObj?.answer || "No response provided.";
                const isCorrect = studentAnsObj?.isCorrect || false;

                return (
                  <div key={q._id} className="p-3 border rounded-3 bg-white" style={{ borderLeftWidth: "6px", borderLeftColor: isCorrect ? "#10b981" : "#ef4444" }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="badge bg-light text-dark border">Q{idx + 1} | {q.type}</span>
                      <span className={`badge ${isCorrect ? "bg-success" : "bg-danger"}`}>
                        {isCorrect ? `Correct (+${q.marks} marks)` : "Incorrect (0 marks)"}
                      </span>
                    </div>

                    <h5 style={{ fontWeight: 700, margin: "8px 0", fontSize: "1.05rem" }}>{q.question}</h5>

                    {q.image && (
                      <div className="my-2">
                        <img src={q.image} alt="Question Diagram" style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 6 }} />
                      </div>
                    )}

                    <div className="mt-3" style={{ fontSize: "0.88rem" }}>
                      <div className="p-2 border rounded bg-light mb-2">
                        <strong>Your Response:</strong> <span className={isCorrect ? "text-success" : "text-danger"}>{answerText}</span>
                      </div>

                      {q.type === "MCQ" && !isCorrect && (
                        <div className="p-2 border rounded bg-success-light mb-2" style={{ background: "rgba(16,185,129,0.04)" }}>
                          <strong>Correct Option:</strong> <span className="text-success">{q.correctAnswer}</span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="text-muted mt-2" style={{ fontSize: "0.82rem" }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-top text-center">
          <button className="mock-exam-button" onClick={() => navigate("/mock-exams")}>
            Back to Mock Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockExamResult;