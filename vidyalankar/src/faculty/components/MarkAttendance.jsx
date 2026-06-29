import React from "react";
import { useNavigate } from "react-router-dom";
import "./AttendancePanel.css";

const cardsData = [
  {
    label: "Theory Attendance",
    badge: "Theory",
    description: "Record attendance for regular classroom theory lectures.",
    icon: "bi-journal-bookmark-fill",
    path: "/theory-ciann-cards",
    color: "blue",
  },
  {
    label: "Practical Attendance",
    badge: "Practical",
    description: "Mark attendance for practical lab experiments and batches.",
    icon: "bi-cpu-fill",
    path: "/practical-ciann-cards",
    color: "emerald",
  },
  {
    label: "Extra Theory Attendance",
    badge: "Extra",
    description: "Schedule and record attendance for extra theory sessions.",
    icon: "bi-calendar-plus-fill",
    path: "/extra-theory-ciann-cards",
    color: "indigo",
  },
  {
    label: "Extra Practical Attendance",
    badge: "Extra Lab",
    description: "Record attendance for extra practical and make-up lab sessions.",
    icon: "bi-folder-plus",
    path: "/extra-practical-ciann-cards",
    color: "pink",
  },
  {
    label: "Tutorial Attendance",
    badge: "Tutorial",
    description: "Record attendance for tutorial classes and small-group discussions.",
    icon: "bi-chat-left-text-fill",
    path: "/tutorial-ciann-cards",
    color: "amber",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.action) {
      card.action();
    }
  };

  return (
    <div className="attendance-panel-page">
      <section className="attendance-panel-hero">
        <h2>Mark Attendance</h2>
        <p>Select an attendance type to continue.</p>
      </section>
      <section className="attendance-panel-grid">
        {cardsData.map((card) => (
          <button
            key={card.label}
            type="button"
            className={`attendance-panel-card theme-${card.color}`}
            onClick={() => handleCardClick(card)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <div className="attendance-panel-card-body">
              <div className="attendance-panel-card-header">
                <span className="attendance-panel-badge">{card.badge}</span>
                <span className="attendance-panel-icon">
                  <i className={`bi ${card.icon}`}></i>
                </span>
              </div>
              <h3 className="attendance-panel-title">{card.label}</h3>
              <p className="attendance-panel-desc">{card.description}</p>
            </div>
            <div className="attendance-panel-action">
              <span>Continue</span>
              <i className="bi bi-arrow-right-short"></i>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
