import React from "react";
import { useNavigate } from "react-router-dom";
import "./PracticalExamDashboard.css";

const PracticalExamDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "workspace",
      title: "Open Practical Workspace",
      description:
        "Follow the guided flow: choose department, choose course, then perform actions.",
      buttonText: "Open Workspace",
      icon: "bi-diagram-3-fill",
      tone: "primary",
      onClick: () => navigate("/faculty/practical-exams"),
    },
    {
      id: "manage-list",
      title: "Manage List",
      description: "View and manage practical exams and questions.",
      buttonText: "Manage Exams",
      icon: "bi-list-check",
      tone: "info",
      onClick: () => navigate("/faculty/practical-exams/manage"),
    },
    {
      id: "enable-disable",
      title: "Visibility Controls",
      description: "Control which exams are visible to students.",
      buttonText: "Manage Status",
      icon: "bi-eye-slash-fill",
      tone: "warning",
      onClick: () => navigate("/faculty/practical-exams/status"),
    },
  ];

  return (
    <div className="practical-exam-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Practical Exam Management</h1>
        <p className="dashboard-subtitle">
          Keep exam setup simple with a guided workspace and quick controls
        </p>
      </div>

      <div className="dashboard-flow-bar">
        <span>1. Select Department</span>
        <span>2. Select Course</span>
        <span>3. Add, Manage, or Publish</span>
      </div>

      <div className="cards-container">
        {cards.map((card) => (
          <div key={card.id} className={`dashboard-card tone-${card.tone}`}>
            <div className="card-header">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="card-body">
              <h2 className="card-title">{card.title}</h2>
              <p className="card-description">{card.description}</p>
            </div>
            <div className="card-footer">
              <button className="dashboard-cta" onClick={card.onClick}>
                {card.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticalExamDashboard;
