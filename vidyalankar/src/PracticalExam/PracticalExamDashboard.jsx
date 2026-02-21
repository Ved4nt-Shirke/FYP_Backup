import React from "react";
import { useNavigate } from "react-router-dom";
import "./PracticalExamDashboard.css";

const PracticalExamDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "add-practical",
      title: "Add Practical",
      description: "Create a new practical exam and assign divisions.",
      buttonText: "Add Practical",
      icon: "bi-plus-circle-fill",
      color: "#3498db",
      onClick: () => navigate("/faculty/practical-exams/add"),
    },
    {
      id: "manage-list",
      title: "Manage List",
      description: "View and manage practical exams and questions.",
      buttonText: "Manage Exams",
      icon: "bi-list-check",
      color: "#2ecc71",
      onClick: () => navigate("/faculty/practical-exams/manage"),
    },
    {
      id: "enable-disable",
      title: "Enable/Disable Practical Exam",
      description: "Control which exams are visible to students.",
      buttonText: "Manage Status",
      icon: "bi-eye-slash-fill",
      color: "#e74c3c",
      onClick: () => navigate("/faculty/practical-exams/status"),
    },
  ];

  return (
    <div className="practical-exam-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Practical Exam Management</h1>
        <p className="dashboard-subtitle">
          Manage practical exams, questions, and visibility settings
        </p>
      </div>

      <div className="cards-container">
        {cards.map((card) => (
          <div key={card.id} className="dashboard-card">
            <div className="card-header" style={{ borderTopColor: card.color }}>
              <i className={`bi ${card.icon}`} style={{ color: card.color }}></i>
            </div>
            <div className="card-body">
              <h2 className="card-title">{card.title}</h2>
              <p className="card-description">{card.description}</p>
            </div>
            <div className="card-footer">
              <button
                className="btn btn-primary"
                style={{ backgroundColor: card.color }}
                onClick={card.onClick}
              >
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
