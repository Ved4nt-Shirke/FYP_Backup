// src/Attendance/ViewAttendance.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";
import "./Dashboard.css";

export default function ViewAttendance() {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  const cardsData = [
    {
      label: "VIEW THEORY ATTENDANCE",
      icon: "bi-eye-fill",
      path: "/view-theory-attendance",
    },
    {
      label: "VIEW PRACTICAL ATTENDANCE",
      icon: "bi-eye-fill",
      path: "/View-practical-ciaann",
    },
    {
      label: "VIEW EXTRA THEORY ATTENDANCE",
      icon: "bi-eye-fill",
      path: "/view-extra-theory-attendance",
    },
    {
      label: "VIEW TUTORIAL ATTENDANCE",
      icon: "bi-eye-fill",
      path: "/view-tutorial-attendance",
    },
    {
      label: "VIEW EXTRA PRACTICAL ATTENDANCE",
      icon: "bi-eye-fill",
      path: "/view-practical-ciaan1",
    },
  ];

  return (
    <>
      <Header showSearch={false} />
      <div className="scrollable-wrapper">
        <div className="card-container">
          {cardsData.map((card) => (
            <div
              key={card.label}
              className="card-item"
              onClick={() => handleCardClick(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleCardClick(card.path)
              }
            >
              <i className={`card-icon ${card.icon}`}></i>
              <p className="card-label">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
