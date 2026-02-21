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
      label: "MANAGE DEPARTMENTS",
      icon: "bi-building",
      path: "/admin-departments",
      description: "Create, view, and manage departments in your institution",
      available: true,
    },
    {
      label: "CREATE FACULTY USER",
      icon: "bi-person-plus",
      path: "/admin-create-faculty",
      description:
        "Create new faculty accounts with auto-generated credentials",
      available: true,
    },
    {
      label: "CREATE OFFICE STAFF",
      icon: "bi-person-badge",
      path: "/admin-create-office-staff",
      description: "Create new office staff accounts for student management",
      available: true,
    },
    {
      label: "MANAGE FACULTY",
      icon: "bi-people",
      path: "/admin-faculty",
      description: "View, edit, or manage faculty profiles and information",
      available: true,
    },
    {
      label: "MANAGE OFFICE STAFF",
      icon: "bi-person-badge",
      path: "/admin-office-staff",
      description:
        "View, edit, or manage office staff profiles and information",
      available: true,
    },
    {
      label: "MANAGE COURSES & SUBJECTS",
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
      <div className="admin-dash-header">
        <h2>Admin Dashboard</h2>
        <p>Manage {adminInstitution} Institution Settings</p>
      </div>

      {alertMessage && (
        <div className="admin-dash-banner">
          <i className="bi bi-exclamation-circle"></i>
          <div>
            <div className="admin-dash-banner-title">Notice</div>
            <div className="admin-dash-banner-text">{alertMessage}</div>
          </div>
          <button
            onClick={closeAlert}
            className="admin-dash-banner-close"
            aria-label="Close alert"
          >
            ✕
          </button>
        </div>
      )}

      <div className="admin-dash-grid">
        {adminCardsData.map((card, index) => (
          <div
            key={index}
            className={`admin-dash-card ${!card.available ? "coming-soon" : ""}`}
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
            <div className="admin-dash-icon-wrap">
              <i className={`bi ${card.icon} admin-dash-icon`}></i>
            </div>
            <h3 className="admin-dash-label">{card.label}</h3>

            <p className="admin-dash-description">{card.description}</p>
            {!card.available && (
              <span className="admin-dash-badge">COMING SOON</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
