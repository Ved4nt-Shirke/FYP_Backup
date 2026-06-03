import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";
import "./AttendancePanel.css";

export default function EditAttendance() {
  const navigate = useNavigate();

  // Function to handle navigation
  const handleCardClick = (path) => {
    navigate(path);
  };

  // Card data similar to Dashboard structure
  const cardsData = [
    {
      label: "Edit Theory Attendance",
      icon: "bi-pencil-square",
      path: "/edit-attendance1",
    },
    {
      label: "Edit Practical Attendance",
      icon: "bi-pencil-square",
      path: "/edit-practical-attendance1",
    },
    {
      label: "Edit Extra Theory Attendance",
      icon: "bi-pencil-square",
      path: "/edit-extra-theory-attendance1",
    },
    {
      label: "Edit Tutorial Attendance",
      icon: "bi-pencil-square",
      path: "/edit-tutorial-attendance1",
    },
    {
      label: "Edit Extra Practical Attendance",
      icon: "bi-pencil-square",
      path: "/edit-extra-practical-attendance1",
    },
  ];

  return (
    <>
      <Header showSearch={false} />
      <div className="attendance-panel-page">
        <section className="attendance-panel-hero">
          <h2>Edit Attendance</h2>
          <p>Select an attendance type to continue.</p>
        </section>
        <section className="attendance-panel-grid">
          {cardsData.map((card) => (
            <button
              key={card.label}
              type="button"
              className="attendance-panel-card"
              onClick={() => handleCardClick(card.path)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleCardClick(card.path)
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
    </>
  );
}
