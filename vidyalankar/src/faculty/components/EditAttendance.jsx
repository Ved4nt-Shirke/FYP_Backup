import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import "./AttendancePanel.css";

export default function EditAttendance() {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  const cardsData = [
    {
      label: "Edit Theory Attendance",
      badge: "Theory",
      description: "Modify recorded attendance for regular classroom theory lectures.",
      icon: "bi-journal-bookmark-fill",
      path: "/edit-attendance1",
      color: "blue",
    },
    {
      label: "Edit Practical Attendance",
      badge: "Practical",
      description: "Modify recorded attendance for practical lab experiments and batches.",
      icon: "bi-cpu-fill",
      path: "/edit-practical-attendance1",
      color: "emerald",
    },
    {
      label: "Edit Extra Theory Attendance",
      badge: "Extra",
      description: "Modify scheduled extra theory session attendance records.",
      icon: "bi-calendar-plus-fill",
      path: "/edit-extra-theory-attendance1",
      color: "indigo",
    },
    {
      label: "Edit Extra Practical Attendance",
      badge: "Extra Lab",
      description: "Modify scheduled extra practical and make-up lab session attendance records.",
      icon: "bi-folder-plus",
      path: "/edit-extra-practical-attendance1",
      color: "pink",
    },
    {
      label: "Edit Tutorial Attendance",
      badge: "Tutorial",
      description: "Modify recorded attendance for tutorial classes and small groups.",
      icon: "bi-chat-left-text-fill",
      path: "/edit-tutorial-attendance1",
      color: "amber",
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
              className={`attendance-panel-card theme-${card.color}`}
              onClick={() => handleCardClick(card.path)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleCardClick(card.path)
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
    </>
  );
}
