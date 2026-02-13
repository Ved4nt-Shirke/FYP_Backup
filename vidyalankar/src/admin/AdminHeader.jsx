import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

const AdminHeader = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  // Get admin info from localStorage
  const adminInstitution = localStorage.getItem("college") || "VP";
  const username = localStorage.getItem("username") || "Admin";

  const institutionNames = {
    VP: "Vidyalankar Polytechnic",
    VIT: "Vidyalankar Institute of Technology",
    VSIT: "Vidyalankar School of Information Technology",
  };

  const fullInstitutionName =
    institutionNames[adminInstitution] || adminInstitution;

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <header className="admin-page-header">
      <div className="header-left">
        {/* Mobile menu toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="admin-page-titles">
          <h1 className="admin-page-title">{adminInstitution} Admin Panel</h1>
          <p className="admin-page-subtitle">{fullInstitutionName}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="admin-user-info">
          <div className="user-avatar">
            <span>{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-details">
            <span className="user-name">{username}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
