import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/mockExam.css";

const RenderFormattedText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="formatted-text-container">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={index} className="code-block-wrapper my-2">
              <div className="code-block-header">{lang}</div>
              <pre className="m-0"><code>{code}</code></pre>
            </div>
          );
        }
        let innerHTML = part
          .replace(/\$\$(.*?)\$\$/g, '<div class="text-center p-2 my-2 border rounded bg-light font-monospace text-dark">$1</div>')
          .replace(/\$(.*?)\$/g, '<span class="px-1 font-monospace text-danger bg-light border rounded">$1</span>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
          .replace(/\n/g, '<br />');
        return (
          <span key={index} dangerouslySetInnerHTML={{ __html: innerHTML }} />
        );
      })}
    </div>
  );
};

const MockExamResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result || null;
  const exam = location.state?.exam || null;
  const [zoomImage, setZoomImage] = useState(null);

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

                    <div style={{ fontWeight: 700, margin: "8px 0", fontSize: "1.05rem" }}>
                      <RenderFormattedText text={q.question} />
                    </div>

                    {/* Question Image Gallery */}
                    {((q.images && q.images.length > 0) || q.image) && (
                      <div className="multiple-images-list my-2">
                        {(q.images && q.images.length > 0 ? q.images : [q.image]).filter(Boolean).map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="question-image-container" onClick={() => setZoomImage(imgUrl)}>
                            <img src={imgUrl} alt={`Question graphic ${imgIdx + 1}`} style={{ maxHeight: 100 }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Options Review List */}
                    {q.type === "MCQ" && q.options && Array.isArray(q.options) && (
                      <div className="student-option-card-wrapper mb-3">
                        {q.options.map((opt, oIdx) => {
                          const label = ["A", "B", "C", "D"][oIdx];
                          const optObj = typeof opt === "object" && opt !== null ? opt : { text: opt || "", image: "" };
                          const optionVal = optObj.text || `Option ${label}`;
                          const isStudentSelected = answerText === optionVal;
                          const isCorrectOpt = q.correctAnswer === optionVal;
                          
                          let borderClass = "";
                          if (isCorrectOpt) {
                            borderClass = "border-success bg-success-light text-success";
                          } else if (isStudentSelected && !isCorrectOpt) {
                            borderClass = "border-danger bg-danger-light text-danger";
                          }

                          return (
                            <div key={oIdx} className={`mock-exam-option-card d-flex flex-column align-items-start gap-2 ${borderClass}`} style={{ margin: 0 }}>
                              <div className="d-flex align-items-center gap-2 w-100">
                                <strong className="text-secondary">{label}.</strong>
                                {optObj.text && <span>{optObj.text}</span>}
                                {isCorrectOpt && <i className="bi bi-check-circle-fill text-success ms-auto" />}
                                {isStudentSelected && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger ms-auto" />}
                              </div>
                              {optObj.image && (
                                <div className="student-option-image-container" onClick={(e) => { e.stopPropagation(); setZoomImage(optObj.image); }}>
                                  <img src={optObj.image} alt={`Option ${label}`} style={{ maxHeight: 100 }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
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

      {/* Zoom Modal overlay */}
      {zoomImage && (
        <div className="zoom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-modal-close" onClick={() => setZoomImage(null)}>
              <i className="bi bi-x-lg" />
            </button>
            <img src={zoomImage} alt="Enlarged preview" className="zoom-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MockExamResult;