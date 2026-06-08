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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt] = useState(Date.now());

  const submitExam = async (autoSubmitted = false) => {
    if (!exam || submitting || attempt) return;

    try {
      setSubmitting(true);
      const response = await axios.post(config.mockExamsStudent.submit(examId), {
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        timeTaken: Math.floor((Date.now() - startedAt) / 1000),
        autoSubmitted,
      });

      localStorage.removeItem(`mock-exam-${examId}`);
      navigate("/mock-exams/result", {
        state: {
          result: response.data?.result,
          exam,
        },
      });
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError.message || "Failed to submit exam");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(config.mockExamsStudent.details(examId));
        const payload = response.data || {};
        setExam(payload.exam || null);
        setAttempt(payload.attempt || null);
        const savedAnswers = localStorage.getItem(`mock-exam-${examId}`);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        const endTime = new Date(payload.exam?.endTime || Date.now()).getTime();
        const startTime = new Date(payload.exam?.startTime || Date.now()).getTime();
        const initialSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(initialSeconds || Math.max(0, Math.floor(((startTime + (payload.exam?.duration || 0) * 60000) - Date.now()) / 1000)));
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [examId]);

  useEffect(() => {
    if (!exam || exam.status !== "active" || attempt) return undefined;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerRef.current);
  }, [exam, attempt]);

  useEffect(() => {
    if (examId) {
      localStorage.setItem(`mock-exam-${examId}`, JSON.stringify(answers));
    }
  }, [answers, examId]);

  const questions = exam?.questions || [];
  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || "" : "";

  const statusMessage = useMemo(() => {
    if (!exam) return "";
    if (attempt) return "You already submitted this exam.";
    if (exam.status !== "active") return `This exam is ${exam.status}.`;
    return `Time left: ${formatTime(timeLeft)}`;
  }, [exam, attempt, timeLeft]);

  if (loading) return <div className="mock-exam-page mock-exam-shell">Loading exam...</div>;
  if (error) return <div className="mock-exam-page mock-exam-shell">{error}</div>;
  if (!exam) return <div className="mock-exam-page mock-exam-shell">Exam not found</div>;

  if (attempt || !exam.canAttempt) {
    return (
      <div className="mock-exam-shell">
        <div className="mock-exam-page">
          <h1 className="mock-exam-title">{exam.title}</h1>
          <p className="mock-exam-subtitle">{statusMessage}</p>
          <button className="mock-exam-button secondary" onClick={() => navigate("/mock-exams")}>Back to exams</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">Attempting Exam</span>
            <h1 className="mock-exam-title">{exam.title}</h1>
            <p className="mock-exam-subtitle">{statusMessage}</p>
          </div>
          <button className="mock-exam-button danger" onClick={() => submitExam(false)} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>

        <div className="mock-exam-stats">
          <div className="mock-exam-stat"><span>Question</span><strong>{currentIndex + 1} / {questions.length}</strong></div>
          <div className="mock-exam-stat"><span>Time Left</span><strong>{formatTime(timeLeft)}</strong></div>
          <div className="mock-exam-stat"><span>Subject</span><strong>{exam.subject}</strong></div>
        </div>

        <div className="mock-exam-card mb-3">
          <div className="mock-exam-nav-grid">
            {questions.map((question, index) => (
              <button key={question._id} className={`mock-exam-nav-btn ${index === currentIndex ? "active" : ""}`} onClick={() => setCurrentIndex(index)}>
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {currentQuestion ? (
          <div className="mock-exam-card">
            <div className="mock-exam-question-top">
              <strong>Question {currentIndex + 1}</strong>
              <span className="mock-exam-question-meta">
                {currentQuestion.type} | {currentQuestion.marks} marks
              </span>
            </div>
            <h3>{currentQuestion.question}</h3>

            {currentQuestion.type === "MCQ" ? (
              <div>
                {(currentQuestion.options || []).map((option, optionIndex) => (
                  <label key={optionIndex} className="mock-exam-option">
                    <input
                      type="radio"
                      name={currentQuestion._id}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [currentQuestion._id]: option }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="mock-exam-textarea mt-3"
                placeholder="Type your answer here"
                value={currentAnswer}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion._id]: e.target.value }))}
              />
            )}

            <div className="mock-exam-divider" />
            <div className="d-flex justify-content-between gap-2 flex-wrap">
              <button
                className="mock-exam-button secondary"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              <button
                className="mock-exam-button secondary"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex >= questions.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MockExamAttempt;