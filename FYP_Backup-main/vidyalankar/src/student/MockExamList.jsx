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
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(config.mockExamsStudent.list);
        setExams(response.data?.exams || []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError.message || "Failed to load mock exams");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const counts = useMemo(
    () => ({
      upcoming: exams.filter((exam) => exam.status === "upcoming").length,
      active: exams.filter((exam) => exam.status === "active").length,
      completed: exams.filter((exam) => exam.status === "completed").length,
    }),
    [exams],
  );

  const visibleExams = filter === "all" ? exams : exams.filter((exam) => exam.status === filter);

  if (loading) {
    return <div className="mock-exam-page mock-exam-shell">Loading exams...</div>;
  }

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">Student View</span>
            <h1 className="mock-exam-title">Mock Exams</h1>
            <p className="mock-exam-subtitle">Only exams that match your course, division, and semester appear here.</p>
          </div>
          <select className="mock-exam-select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minWidth: 180 }}>
            <option value="all">All Exams</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {error ? (
          <div className="mock-exam-card mb-3" style={{ borderColor: "#fca5a5", color: "#fee2e2" }}>
            {error}
          </div>
        ) : null}

        <div className="mock-exam-grid cols-3" style={{ marginBottom: 16 }}>
          <div className="mock-exam-card"><div className="mock-exam-card-title">Upcoming</div><strong>{counts.upcoming}</strong></div>
          <div className="mock-exam-card"><div className="mock-exam-card-title">Active</div><strong>{counts.active}</strong></div>
          <div className="mock-exam-card"><div className="mock-exam-card-title">Completed</div><strong>{counts.completed}</strong></div>
        </div>

        <div className="mock-exam-grid cols-2">
          {visibleExams.map((exam) => (
            <div key={exam._id} className="mock-exam-card">
              <div className="d-flex justify-content-between gap-3 align-items-start">
                <div>
                  <div className="mock-exam-pill mb-2">{exam.status}</div>
                  <h3 className="mb-2">{exam.title}</h3>
                  <div className="mock-exam-question-meta">
                    {exam.subject} {exam.subjectCode ? `(${exam.subjectCode})` : ""}
                  </div>
                </div>
                <span className={`mock-exam-status ${exam.status}`}>{exam.status}</span>
              </div>

              <div className="mock-exam-stats">
                <div className="mock-exam-stat"><span>Duration</span><strong>{exam.duration} min</strong></div>
                <div className="mock-exam-stat"><span>Questions</span><strong>{exam.totalQuestions}</strong></div>
                <div className="mock-exam-stat"><span>Total Marks</span><strong>{exam.totalMarks}</strong></div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {exam.status === "active" && !exam.attempt ? (
                  <button className="mock-exam-button" onClick={() => navigate(`/mock-exams/${exam._id}/attempt`)}>
                    Start Exam
                  </button>
                ) : null}
                {exam.status === "upcoming" ? <button className="mock-exam-button secondary" disabled>Not Started</button> : null}
                {exam.attempt ? (
                  <button className="mock-exam-button secondary" onClick={() => navigate("/mock-exams/result", { state: { result: exam.attempt, exam } })}>
                    View Result
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {!visibleExams.length ? <div className="mock-exam-card mt-3">No mock exams available.</div> : null}
      </div>
    </div>
  );
};

export default MockExamList;
