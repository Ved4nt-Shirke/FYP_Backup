import React from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import "./AdminHeader.css";

const AdminHeader = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  // Get admin info from localStorage
  const adminInstitution = (
    localStorage.getItem("college") || "VP"
  ).toUpperCase();
  const institutionCode = (
    localStorage.getItem("institutionCode") || adminInstitution
  ).toUpperCase();
  const institutionName =
    localStorage.getItem("institutionName") || institutionCode;
  const institutionLogoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const institutionFallback = getInstitutionInitials(
    institutionName,
    institutionCode,
  );
  const username = localStorage.getItem("username") || "Admin";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <header className="admin-page-header">
      <div className="admin-header-left">
        {/* Mobile menu toggle */}
        <button
          className="admin-mobile-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="admin-page-titles">
          <h1 className="admin-page-title">
            <span className="institution-brand">
              {institutionLogoUrl ? (
                <img
                  src={institutionLogoUrl}
                  alt={institutionName}
                  className="institution-brand-logo"
                />
              ) : (
                <span className="institution-brand-fallback">
                  {institutionFallback}
                </span>
              )}
              {institutionCode} Admin Panel
            </span>
          </h1>
          <p className="admin-page-subtitle">{institutionName}</p>
        </div>
      </div>

      <div className="admin-header-right">
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
