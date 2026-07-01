import React from "react";
import { useNavigate } from "react-router-dom";
import "./AttendancePanel.css";

const cardsData = [
  {
    label: "Theory Attendance",
    icon: "bi-calendar-check",
    path: "/theory-Ciaan-cards",
  },
  {
    label: "Practical Attendance",
    icon: "bi-calendar-check-fill",
    path: "/practical-Ciaan-cards",
  },
  {
    label: "Extra Theory Attendance",
    icon: "bi-calendar-plus",
    path: "/extra-theory-Ciaan-cards",
  },
  {
    label: "Extra Practical Attendance",
    icon: "bi-calendar-plus-fill",
    path: "/extra-practical-Ciaan-cards",
  },
  {
    label: "Tutorial Attendance",
    icon: "bi-journals",
    path: "/tutorial-Ciaan-cards",
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
            className="attendance-panel-card"
            onClick={() => handleCardClick(card)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <div className="attendance-panel-card-top">
              <span className="attendance-panel-icon">
                <i className={`bi ${card.icon}`}></i>
              </span>
              <h3 className="attendance-panel-title">{card.label}</h3>
            </div>
            <div className="attendance-panel-footer">
              Continue <i className="bi bi-arrow-right"></i>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};
export default Dashboard;
