import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { config } from "../config/api";
import "../styles/mockExam.css";

const formatTime = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

const MockExamAttempt = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [reviewList, setReviewList] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt] = useState(Date.now());

  // Security & Warnings
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [preventTabSwitch, setPreventTabSwitch] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [inFullscreen, setInFullscreen] = useState(false);

  // Initialize and Fetch
  useEffect(() => {
    const initializeExam = async () => {
      try {
        setLoading(true);
        // Call start endpoint to initialize the attempt
        const startRes = await axios.post(`${config.mockExams}/student/exams/${examId}/start`);
        const attemptObj = startRes.data?.attempt;

        const detailsRes = await axios.get(config.mockExamsStudent.details(examId));
        const payload = detailsRes.data || {};
        const examObj = payload.exam || null;

        setExam(examObj);
        setAttempt(attemptObj || payload.attempt || null);

        // Security Configurations
        setFullscreenRequired(Boolean(examObj?.fullscreenRequired));
        setPreventTabSwitch(Boolean(examObj?.preventTabSwitch));

        // Load pre-existing answers if resuming
        const savedAnswers = {};
        if (attemptObj && Array.isArray(attemptObj.answers)) {
          attemptObj.answers.forEach((ans) => {
            savedAnswers[ans.questionId] = ans.answer;
          });
        }
        setAnswers(savedAnswers);

        // Mark first question as visited
        if (examObj?.questions?.length > 0) {
          setVisited({ [examObj.questions[0]._id]: true });
        }

        // Calculate time left
        const endTime = new Date(examObj?.endTime).getTime();
        const durationSecs = (examObj?.duration || 60) * 60;
        const serverTimeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(Math.min(durationSecs, serverTimeLeft));
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load exam details");
      } finally {
        setLoading(false);
      }
    };

    initializeExam();
  }, [examId]);

  // Main Timer Countdown
  useEffect(() => {
    if (!exam || submitting) return undefined;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [exam, submitting]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (!exam || submitting) return;

    const handleKeyDown = (e) => {
      const q = exam.questions[currentIndex];
      if (!q) return;

      // Navigate Questions (Left/Right Arrows)
      if (e.key === "ArrowRight") {
        navigateQuestion("next");
      } else if (e.key === "ArrowLeft") {
        navigateQuestion("prev");
      }

      // Option selections (1, 2, 3, 4) for MCQs
      if (q.type === "MCQ") {
        const optionKeys = ["1", "2", "3", "4"];
        if (optionKeys.includes(e.key)) {
          const idx = optionKeys.indexOf(e.key);
          const opt = q.options[idx];
          if (opt) {
            handleAnswerSelect(q._id, opt);
          }
        }
      }

      // Mark for Review (Spacebar or 'r' key)
      if (e.key.toLowerCase() === "r" || e.key === " ") {
        e.preventDefault();
        toggleMarkForReview(q._id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exam, currentIndex, answers, submitting]);

  // Security tab-switching event listeners
  useEffect(() => {
    if (!exam || !preventTabSwitch || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            alert("Security Violation: You left the exam screen 3 times. The exam will now submit automatically.");
            handleAutoSubmit();
          } else {
            alert(`Security Warning: Do not leave the exam tab! (Warning ${next}/3). Continuing will auto-submit.`);
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [exam, preventTabSwitch, submitting]);

  // Fullscreen Exit Event Listener
  useEffect(() => {
    if (!exam || !fullscreenRequired || submitting) return;

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setInFullscreen(isFull);
      if (!isFull) {
        setFullscreenWarnings((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            alert("Security Violation: You exited fullscreen 3 times. The exam will submit automatically.");
            handleAutoSubmit();
          } else {
            alert(`Security Warning: Fullscreen mode is required! Please enter fullscreen. (Warning ${next}/3)`);
            requestFullscreen();
          }
          return next;
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [exam, fullscreenRequired, submitting]);

  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen()
        .then(() => setInFullscreen(true))
        .catch(() => {});
    }
  };

  // Submit Exam handler
  const submitExam = async (isAuto = false) => {
    if (!exam || submitting) return;
    try {
      setSubmitting(true);
      // Clean up fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const response = await axios.post(`${config.mockExams}/student/exams/${examId}/submit`, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        timeTaken: Math.floor((Date.now() - startedAt) / 1000),
        isAutoSave: false
      });

      navigate("/mock-exams/result", {
        state: {
          result: response.data?.result,
          exam,
        },
      });
    } catch (submitError) {
      setError("Failed to submit exam answers.");
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    submitExam(true);
  };

  // Backend Auto-Save handler (real-time progress save)
  const autoSaveProgress = async (updatedAnswers) => {
    try {
      await axios.post(`${config.mockExams}/student/exams/${examId}/submit`, {
        answers: Object.entries(updatedAnswers).map(([questionId, answer]) => ({ questionId, answer })),
        timeTaken: Math.floor((Date.now() - startedAt) / 1000),
        isAutoSave: true
      });
    } catch (err) {
      console.warn("Failed to auto-save exam answers", err);
    }
  };

  const handleAnswerSelect = (qId, optionVal) => {
    const nextAnswers = { ...answers, [qId]: optionVal };
    setAnswers(nextAnswers);
    // Auto save to database
    autoSaveProgress(nextAnswers);
  };

  const toggleMarkForReview = (qId) => {
    setReviewList((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const navigateQuestion = (dir) => {
    const questions = exam?.questions || [];
    let nextIdx = currentIndex;
    if (dir === "next") {
      nextIdx = Math.min(questions.length - 1, currentIndex + 1);
    } else {
      nextIdx = Math.max(0, currentIndex - 1);
    }

    setCurrentIndex(nextIdx);

    // Mark as visited
    const nextQ = questions[nextIdx];
    if (nextQ) {
      setVisited((prev) => ({ ...prev, [nextQ._id]: true }));
    }
  };

  const jumpToQuestion = (idx) => {
    setCurrentIndex(idx);
    const q = exam.questions[idx];
    if (q) {
      setVisited((prev) => ({ ...prev, [q._id]: true }));
    }
  };

  const questions = exam?.questions || [];
  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || "" : "";

  // Progress Bar percentage
  const answeredCount = useMemo(() => Object.keys(answers).filter(Boolean).length, [answers]);
  const progressPct = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((answeredCount / questions.length) * 100).toFixed(0);
  }, [answeredCount, questions]);

  if (loading) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status" />
          <div className="text-muted">Loading secure exam window...</div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="text-center p-4 border rounded-3 bg-white shadow-sm" style={{ maxWidth: 440, margin: "40px auto" }}>
          <i className="bi bi-exclamation-triangle-fill text-danger mb-3" style={{ fontSize: "3rem" }} />
          <h3 style={{ fontWeight: 800 }}>Attempt Initialization Failed</h3>
          <p className="text-muted mb-4">{error || "The mock exam could not be loaded."}</p>
          <button className="mock-exam-button w-100" onClick={() => navigate("/student/mock-exams")}>
            Go Back to Mock Exams
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen Required Splash Screen
  if (fullscreenRequired && !inFullscreen) {
    return (
      <div className="mock-exam-shell d-flex align-items-center justify-content-center bg-dark text-white" style={{ minHeight: "100vh", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
        <div className="text-center p-4" style={{ maxWidth: 460 }}>
          <i className="bi bi-shield-lock-fill text-warning mb-3" style={{ fontSize: "3.5rem" }} />
          <h2 className="mb-3" style={{ fontWeight: 800 }}>Fullscreen Mode Required</h2>
          <p className="text-muted mb-4">
            This examination is configured with high security. You must click the button below to enter fullscreen mode and begin/resume your attempt.
          </p>
          <button className="mock-exam-button w-100" onClick={requestFullscreen}>
            Enter Fullscreen to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        {/* Top bar progress / info */}
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2 flex-wrap gap-2">
          <div>
            <h2 className="mb-1 text-dark" style={{ fontSize: "1.25rem", fontWeight: 800 }}>{exam.title}</h2>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Subject: <strong>{exam.subject} ({exam.subjectCode})</strong>
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Timer card */}
            <div className="p-2 px-3 border rounded-3 bg-light text-center" style={{ minWidth: 120 }}>
              <span className="text-muted d-block" style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>Time Left</span>
              <strong style={{ fontSize: "1.15rem", color: timeLeft < 300 ? "#ef4444" : "var(--primary-color)" }}>{formatTime(timeLeft)}</strong>
            </div>

            <button className="mock-exam-button danger" onClick={() => submitExam(false)} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress mb-4" style={{ height: "6px" }}>
          <div className="progress-bar bg-success" role="progressbar" style={{ width: `${progressPct}%` }} />
        </div>

        {error ? <div className="alert alert-danger mb-3">{error}</div> : null}

        {/* Left Nav Palette & Right Main Question area */}
        <div className="mock-exam-layout">
          {/* Left palette */}
          <div className="mock-exam-palette">
            <h3 className="mock-exam-card-title mb-3">Navigation palette</h3>
            <div className="mock-exam-palette-grid">
              {questions.map((q, idx) => {
                let statusClass = "not-visited";
                if (reviewList[q._id]) {
                  statusClass = "review";
                } else if (answers[q._id]) {
                  statusClass = "answered";
                } else if (visited[q._id]) {
                  statusClass = "unanswered";
                }

                return (
                  <button
                    key={q._id}
                    className={`mock-exam-palette-btn ${statusClass} ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => jumpToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mock-exam-legend">
              <div className="mock-exam-legend-item">
                <div className="mock-exam-legend-dot answered" /> Answered ({answeredCount})
              </div>
              <div className="mock-exam-legend-item">
                <div className="mock-exam-legend-dot unanswered" /> Unanswered ({questions.length - answeredCount})
              </div>
              <div className="mock-exam-legend-item">
                <div className="mock-exam-legend-dot review" /> Marked for Review
              </div>
              <div className="mock-exam-legend-item">
                <div className="mock-exam-legend-dot notvisited" /> Not Visited
              </div>
            </div>

            {/* Warning stats */}
            {(fullscreenRequired || preventTabSwitch) && (
              <div className="border-top pt-3 mt-3" style={{ fontSize: "0.75rem", color: "#b91c1c" }}>
                <strong>Security Logs:</strong>
                {fullscreenRequired && <div>Fullscreen warning: {fullscreenWarnings}/3</div>}
                {preventTabSwitch && <div>Tab Switch warning: {tabSwitchWarnings}/3</div>}
              </div>
            )}
          </div>

          {/* Right question area */}
          {currentQuestion ? (
            <div className="mock-exam-card">
              <div className="mock-exam-question-top">
                <strong style={{ fontSize: "1.1rem" }}>Question {currentIndex + 1} of {questions.length}</strong>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary">{currentQuestion.type}</span>
                  <span className="badge bg-light text-dark border">{currentQuestion.marks} marks</span>
                  <button className="btn btn-sm btn-light border" onClick={() => toggleMarkForReview(currentQuestion._id)}>
                    <i className={`bi ${reviewList[currentQuestion._id] ? "bi-flag-fill text-warning" : "bi-flag"}`} /> Review
                  </button>
                </div>
              </div>

              {/* Large Question Text */}
              <h3 className="mb-3 text-dark" style={{ fontWeight: 700, fontSize: "1.3rem", lineHeight: 1.4 }}>
                {currentQuestion.question}
              </h3>

              {/* Base64 Image Render */}
              {currentQuestion.image && (
                <div className="my-3 text-center" style={{ background: "#f3f4f6", padding: 12, borderRadius: 10 }}>
                  <img src={currentQuestion.image} alt="Question Graphic" style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 8 }} />
                </div>
              )}

              {/* Options selection */}
              {currentQuestion.type === "MCQ" ? (
                <div className="mt-4">
                  {currentQuestion.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`mock-exam-option-card ${currentAnswer === opt ? "selected" : ""}`}
                      onClick={() => handleAnswerSelect(currentQuestion._id, opt)}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion._id}`}
                        value={opt}
                        checked={currentAnswer === opt}
                        onChange={() => {}} // click handler handles it
                      />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3">
                  <label className="text-muted mb-2 d-block" style={{ fontSize: "0.88rem" }}>Type your answer below:</label>
                  <textarea
                    className="mock-exam-textarea"
                    placeholder="Type descriptive response..."
                    value={currentAnswer}
                    onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                    style={{ minHeight: 180 }}
                  />
                </div>
              )}

              {/* Bottom navigation buttons */}
              <div className="mock-exam-divider" />
              <div className="d-flex justify-content-between gap-3 flex-wrap">
                <button className="mock-exam-button secondary" onClick={() => navigateQuestion("prev")} disabled={currentIndex === 0}>
                  <i className="bi bi-chevron-left" /> Previous Question
                </button>

                <button className="mock-exam-button" onClick={() => navigateQuestion("next")} disabled={currentIndex >= questions.length - 1}>
                  Save & Next <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mock-exam-card text-center py-5">Question not loaded.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockExamAttempt;