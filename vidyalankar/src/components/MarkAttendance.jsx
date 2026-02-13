import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const cardsData = [
  { label: "THEORY ATTENDANCE", icon: "bi-calendar-check", path: "/theory-ciann-cards" },
  { label: "PRACTICAL ATTENDANCE", icon: "bi-calendar-check-fill", path: "/practical-ciann-cards" },
  { label: "EXTRA THEORY ATTENDANCE", icon: "bi-calendar-plus", path: "/extra-theory-ciann-cards" },
  { label: "EXTRA PRACTICAL ATTENDANCE", icon: "bi-calendar-plus-fill", path: "/extra-practical-ciann-cards" },
  { label: "TUTORIAL ATTENDANCE", icon: "bi-journals", path: "/tutorial-ciann-cards" }
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
    <div className="scrollable-wrapper">
      <div className="card-container">
        {cardsData.map((card) => (
          <div
            key={card.label}
            className="card-item"
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <i className={`card-icon ${card.icon}`}></i>
            <p className="card-label">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Dashboard;
