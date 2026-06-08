import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/mockExam.css";

const MockExamDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Create Exam",
      description: "Build a new mock exam with dynamic course, division, semester, and subject data.",
      action: () => navigate("/faculty/mock-exams/create"),
      icon: "bi-plus-circle",
    },
    {
      title: "Manage Exams",
      description: "Edit, duplicate, publish, unpublish, and delete existing mock exams.",
      action: () => navigate("/faculty/mock-exams/manage"),
      icon: "bi-list-check",
    },
    {
      title: "Results",
      description: "Review attempts, marks, time taken, and student performance filters.",
      action: () => navigate("/faculty/mock-exams/results"),
      icon: "bi-bar-chart-line",
    },
  ];

  return (
    <div className="mock-exam-shell">
      <div className="mock-exam-page">
        <div className="mock-exam-hero">
          <div>
            <span className="mock-exam-pill">
              <i className="bi bi-clipboard2-pulse" /> Mock Exam Module
            </span>
            <h1 className="mock-exam-title">Faculty Mock Exam Workspace</h1>
            <p className="mock-exam-subtitle">
              Manage online mock exams with dynamic admin data, student eligibility checks, and result tracking.
            </p>
          </div>
          <button className="mock-exam-button" onClick={() => navigate("/faculty/mock-exams/create")}> 
            <i className="bi bi-plus-lg me-2" /> New Exam
          </button>
        </div>

        <div className="mock-exam-grid">
          {cards.map((card) => (
            <div key={card.title} className="mock-exam-card">
              <div className="d-flex align-items-center gap-3 mb-3">
                <i className={`bi ${card.icon}`} style={{ fontSize: "1.5rem", color: "var(--me-accent)" }} />
                <h3 className="mb-0">{card.title}</h3>
              </div>
              <p className="mock-exam-subtitle">{card.description}</p>
              <button className="mock-exam-button secondary mt-2" onClick={card.action}>
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockExamDashboard;
