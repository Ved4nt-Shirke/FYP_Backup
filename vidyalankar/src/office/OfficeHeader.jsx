import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";

const OfficeHeader = ({ onMenuToggle, staffName = "Office Staff" }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const institutionCode = (
    localStorage.getItem("institutionCode") ||
    localStorage.getItem("college") ||
    "VP"
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="office-header-container">
      <div className="office-header-content">
        <div className="office-header-left">
          <button
            className="menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <i className="bi bi-list"></i>
          </button>
          <div className="office-logo" title={institutionName}>
            <span className="logo-text">{institutionName}</span>
          </div>
        </div>

        <div className="office-header-right">
          <div className="user-menu-wrapper">
            <button
              className="user-button"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <span className="user-avatar">
                {staffName.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{staffName}</span>
              <i className="bi bi-chevron-down dropdown-icon"></i>
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
                      <p className="user-menu-role">Office Staff</p>
                    </div>
                  </div>
                  <div className="user-menu-divider"></div>
                  <button
                    className="user-menu-item logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    Logout
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
