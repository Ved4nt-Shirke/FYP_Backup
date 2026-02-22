import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminInstitution, setAdminInstitution] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    // Get admin's institution from localStorage
    const institution = localStorage.getItem("college") || "VP";
    setAdminInstitution(institution);
  }, []);

  const adminCardsData = [
    {
      label: "Manage Departments",
      icon: "bi-building",
      path: "/admin-departments",
      description: "Create, view, and manage departments in your institution",
      available: true,
    },
    {
      label: "Create Faculty User",
      icon: "bi-person-plus",
      path: "/admin-create-faculty",
      description:
        "Create new faculty accounts with auto-generated credentials",
      available: true,
    },
    {
      label: "Create Office Staff",
      icon: "bi-person-badge",
      path: "/admin-create-office-staff",
      description: "Create new office staff accounts for student management",
      available: true,
    },
    {
      label: "Manage Faculty",
      icon: "bi-people",
      path: "/admin-faculty",
      description: "View, edit, or manage faculty profiles and information",
      available: true,
    },
    {
      label: "Manage Office Staff",
      icon: "bi-person-badge",
      path: "/admin-office-staff",
      description:
        "View, edit, or manage office staff profiles and information",
      available: true,
    },
    {
      label: "Manage Courses & Subjects",
      icon: "bi-journal-text",
      path: "/admin-departments",
      description: "Create and manage courses, divisions, and subjects",
      available: true,
    },
  ];

  const handleCardClick = (card) => {
    if (!card.available) {
      setAlertMessage(card.message || "This feature is coming soon!");
      return;
    }
    if (card.path) {
      navigate(card.path, { state: card.state });
    } else if (card.message) {
      setAlertMessage(card.message);
    }
  };

  const closeAlert = () => {
    setAlertMessage("");
  };

  return (
    <div className="scrollable-wrapper">
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>Manage {adminInstitution} institution operations from one place</p>
      </div>

      {alertMessage && (
        <div className="info-banner">
          <i className="bi bi-exclamation-circle"></i>
          <div>
            <div className="banner-title">Notice</div>
            <div className="banner-text">{alertMessage}</div>
          </div>
          <button
            onClick={closeAlert}
            className="banner-close-btn"
            aria-label="Close alert"
          >
            ✕
          </button>
        </div>
      )}

      <div className="card-container">
        {adminCardsData.map((card, index) => (
          <div
            key={index}
            className={`card-item ${!card.available ? "coming-soon" : ""}`}
            onClick={() => handleCardClick(card)}
            role={card.available ? "button" : "presentation"}
            tabIndex={card.available ? 0 : -1}
            onKeyPress={(e) => {
              if (e.key === "Enter" && card.available) {
                handleCardClick(card);
              }
            }}
            aria-disabled={!card.available}
          >
            <div className="card-icon-wrap">
              <i className={`bi ${card.icon} card-icon`}></i>
            </div>
            <h3 className="card-label">{card.label}</h3>

            <p className="card-description">{card.description}</p>
            {!card.available && (
              <span className="coming-soon-badge">COMING SOON</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
