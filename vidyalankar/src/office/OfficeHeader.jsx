import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import "./OfficeHeader.css";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const OfficeHeader = ({ onMenuToggle, staffName = "Office Staff", currentTab }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifCount] = useState(0);
  const institutionCode = (
    localStorage.getItem("institutionCode") ||
    localStorage.getItem("college") ||
    "VP"
  ).toUpperCase();
  const institutionName =
    localStorage.getItem("institutionName") || institutionCode;

  const tabLabels = {
    upload: "Upload Students",
    manage: "Manage Students",
    notices: "Notices",
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="office-header-container">
      <div className="office-header-content">
        {/* Left: Hamburger + Greeting */}
        <div className="office-header-left">
          <button
            className="menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list"></i>
          </button>
          <div className="header-greeting">
            <p className="greeting-main">
              {getGreeting()} 👋 <span className="greeting-name">{staffName.split(" ")[0]}</span>
            </p>
            <p className="greeting-sub">
              {currentTab ? tabLabels[currentTab] || "Office Portal" : "Student Management System"}
            </p>
          </div>
        </div>

        {/* Right: Bell + Avatar */}
        <div className="office-header-right">
          {/* Notification Bell */}
          <button className="notif-btn" aria-label="Notifications">
            <span className="notif-icon">🔔</span>
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>

          <div className="header-divider" />

          {/* User Avatar */}
          <div className="user-menu-wrapper">
            <button
              className="user-button"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <span className="user-avatar">
                {staffName.charAt(0).toUpperCase()}
              </span>
              <div className="user-info-text">
                <span className="user-name">{staffName}</span>
                <span className="user-role-tag">Office Staff</span>
              </div>
              <i className={`bi bi-chevron-down dropdown-icon ${showUserMenu ? "rotated" : ""}`}></i>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="dropdown-backdrop"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <div className="user-avatar-large">
                      {staffName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="user-menu-name">{staffName}</p>
                      <p className="user-menu-role">Office Staff · {institutionCode}</p>
                    </div>
                  </div>
                  <div className="user-menu-divider"></div>
                  <button
                    className="user-menu-item logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default OfficeHeader;
