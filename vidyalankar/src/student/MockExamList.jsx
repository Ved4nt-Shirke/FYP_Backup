import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "../styles/mockExam.css";

const MockExamList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("available"); // "available", "history"

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        const [examsRes, historyRes] = await Promise.all([
          axios.get(config.mockExamsStudent.list),
          axios.get(config.mockExamsStudent.results),
        ]);

        setExams(examsRes.data?.exams || []);
        setHistory(historyRes.data?.results || []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load exams list");
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  const metrics = useMemo(() => {
    const activeExams = exams.filter((e) => e.status === "active" && !e.attempt).length;
    const completedCount = history.length;

    let averagePct = "0.0";
    if (history.length > 0) {
      const sum = history.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0);
      averagePct = (sum / history.length).toFixed(1);
    }

    return {
      activeExams,
      completedCount,
      averagePct,
    };
  }, [exams, history]);

  const viewAttemptResult = (exam, attemptData) => {
    navigate("/mock-exams/result", {
      state: {
        exam,
        result: attemptData
      }
    });
  };

  if (loading) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status" />
          <div className="text-muted">Loading Mock Exam Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        {/* Student Hub Header */}
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill"><i className="bi bi-person-workspace" /> Student Portal</span>
            <h1 className="mock-exam-title">Mock Exam Hub</h1>
            <p className="mock-exam-subtitle">
              Verify your eligibility, attempt active class examinations, and review your performance history with comprehensive metrics.
            </p>
          </div>
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}

        {/* Student stats metrics */}
        <div className="mock-exam-grid cols-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Available Active Exams</div>
            <strong style={{ color: "var(--primary-color)" }}>{metrics.activeExams}</strong>
            <span className="badge-sec mt-2 d-inline-block">Requires Attention</span>
          </div>
          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Completed Attempts</div>
            <strong style={{ color: "#2563eb" }}>{metrics.completedCount}</strong>
            <span className="badge-sec mt-2 d-inline-block">Evaluated Submissions</span>
          </div>
          <div className="mock-exam-card text-center">
            <div className="mock-exam-card-title">Average Score Pct</div>
            <strong style={{ color: "#8b5cf6" }}>{metrics.averagePct}%</strong>
            <span className="badge-sec mt-2 d-inline-block">Overall Performance</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mock-exam-tabs">
          <button className={`mock-exam-tab ${activeTab === "available" ? "active" : ""}`} onClick={() => setActiveTab("available")}>
            <i className="bi bi-clock-history me-1" /> Active & Upcoming Exams ({exams.length})
          </button>
          <button className={`mock-exam-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
            <i className="bi bi-journal-check me-1" /> Attempt History & Results ({history.length})
          </button>
        </div>

        {/* ────────────────────────────────────────────── */}
        {/* Tab 1: Available & Upcoming Exams */}
        {/* ────────────────────────────────────────────── */}
        {activeTab === "available" && (
          <div className="mock-exam-grid cols-2">
            {exams.map((exam) => {
              const startStr = new Date(exam.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
              const endStr = new Date(exam.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
              const isAttempted = Boolean(exam.attempt);
              const attemptsLeft = exam.attemptsAllowed === "MULTIPLE" ? (exam.maxAttempts - exam.attemptsCount) : (isAttempted ? 0 : 1);

              return (
                <div key={exam._id} className="mock-exam-card d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <span className={`mock-exam-chip ${exam.status}`}>
                        {exam.status === "active" ? "Active Now" : exam.status}
                      </span>
                      <span className="badge bg-light text-dark border">
                        {exam.attemptsAllowed === "SINGLE" ? "Single Attempt" : `Multiple (Remaining: ${attemptsLeft})`}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "6px 0" }} className="text-dark">
                      {exam.title}
                    </h3>
                    <div className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
                      <i className="bi bi-book-half me-1" /> {exam.subject} {exam.subjectCode ? `(${exam.subjectCode})` : ""}
                    </div>

                    {/* Horizontal badges row */}
                    <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5" style={{ fontSize: "0.82rem", borderRadius: "6px", fontWeight: 550 }}>
                        <i className="bi bi-clock text-secondary" />
                        <span>{exam.duration} mins</span>
                      </span>
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5" style={{ fontSize: "0.82rem", borderRadius: "6px", fontWeight: 550 }}>
                        <i className="bi bi-question-circle text-secondary" />
                        <span>{exam.totalQuestions} Questions</span>
                      </span>
                      <span className="badge bg-light text-dark border px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5" style={{ fontSize: "0.82rem", borderRadius: "6px", fontWeight: 550 }}>
                        <i className="bi bi-award text-secondary" />
                        <span>{exam.totalMarks} Marks</span>
                      </span>
                    </div>

                    {/* Timeline row */}
                    <div className="border-top pt-3 mt-3 d-flex flex-column gap-1.5 text-muted" style={{ fontSize: "0.78rem" }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-flex align-items-center gap-1 text-secondary"><i className="bi bi-calendar-event" /> Starts:</span>
                        <span className="text-dark fw-semibold">{startStr}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-flex align-items-center gap-1 text-secondary"><i className="bi bi-calendar-x" /> Ends:</span>
                        <span className="text-dark fw-semibold">{endStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2">
                    {exam.status === "active" && attemptsLeft > 0 ? (
                      <button className="mock-exam-button w-100" onClick={() => navigate(`/mock-exams/${exam._id}/attempt`)}>
                        <i className="bi bi-play-circle-fill" /> {exam.inProgress ? "Resume Attempt" : "Start Examination"}
                      </button>
                    ) : exam.status === "upcoming" ? (
                      <button className="mock-exam-button secondary w-100" disabled>
                        <i className="bi bi-calendar-check" /> Not Started Yet
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        <button className="mock-exam-button secondary w-100" disabled>
                          <i className="bi bi-exclamation-triangle" /> Expired / No attempts left
                        </button>
                        {exam.attempt && (
                          <button className="mock-exam-button secondary w-100" onClick={() => viewAttemptResult(exam, exam.attempt)}>
                            View Result
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {exams.length === 0 && (
              <div className="mock-exam-card text-center py-5" style={{ gridColumn: "span 2" }}>
                <i className="bi bi-info-circle mb-2" style={{ fontSize: "2.5rem", color: "#9ca3af" }} />
                <div>No active or scheduled mock exams found for your course & division.</div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────── */}
        {/* Tab 2: Attempt History & Results */}
        {/* ────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="mock-exam-table">
            {history.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Subject</th>
                    <th className="text-center">Attempt Number</th>
                    <th className="text-center">Score Obtained</th>
                    <th className="text-center">Percentage</th>
                    <th>Time Taken</th>
                    <th>Submitted Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const timeStr = `${Math.floor(h.timeTaken / 60)}m ${h.timeTaken % 60}s`;
                    return (
                      <tr key={h._id}>
                        <td><strong className="text-dark">{h.examTitle}</strong></td>
                        <td>{h.subject} ({h.subjectCode})</td>
                        <td className="text-center"><span className="badge bg-light text-dark border">Attempt #{h.attemptNumber || 1}</span></td>
                        <td className="text-center"><strong>{h.score}</strong> / {h.totalMarks}</td>
                        <td className="text-center">{h.percentage}%</td>
                        <td>{timeStr}</td>
                        <td>{new Date(h.submittedAt).toLocaleString()}</td>
                        <td>
                          <button className="mock-exam-button secondary btn-sm" onClick={() => viewAttemptResult(h.examId, h)} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                            View Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="mock-exam-empty text-center py-5">
                <i className="bi bi-info-circle mb-2" style={{ fontSize: "2.5rem", color: "#9ca3af" }} />
                <div>You haven't attempted any mock examinations yet.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExamList;
