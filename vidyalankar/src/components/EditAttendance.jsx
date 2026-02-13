import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";
import "./Dashboard.css";

export default function EditAttendance() {
  const navigate = useNavigate();

  // Function to handle navigation
  const handleCardClick = (path) => {
    navigate(path);
  };

  // Card data similar to Dashboard structure
  const cardsData = [
    {
      label: "EDIT THEORY ATTENDANCE",
      icon: "bi-pencil-square",
      path: "/edit-attendance1",
    },
    {
      label: "EDIT PRACTICAL ATTENDANCE",
      icon: "bi-pencil-square",
      path: "/edit-practical-attendance1",
    },
    {
      label: "EDIT EXTRA THEORY ATTENDANCE",
      icon: "bi-pencil-square",
      path: "/edit-extra-theory-attendance1",
    },
    {
      label: "EDIT TUTORIAL ATTENDANCE",
      icon: "bi-pencil-square",
      path: "/edit-tutorial-attendance1",
    },
    {
      label: "EDIT EXTRA PRACTICAL ATTENDANCE",
      icon: "bi-pencil-square",
      path: "/edit-extra-practical-attendance1",
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
