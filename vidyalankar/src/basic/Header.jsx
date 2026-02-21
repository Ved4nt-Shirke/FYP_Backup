// src/basic/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import "./Header.css";

const Header = ({
  currentUser,
  showUserDropdown: propShowUserDropdown,
  setShowUserDropdown: propSetShowUserDropdown,
  userDropdownRef: propUserDropdownRef,
  onMenuToggle, // This prop receives the function from App.jsx
  onSecondaryMenuToggle, // This prop receives the function for secondary sidebar toggle
  hidePrimaryMenuToggleOnCompact = false,
  mobileHomePath = "",
}) => {
  const navigate = useNavigate();

  // Initialize local state for user dropdown if props aren't provided
  const [localShowUserDropdown, setLocalShowUserDropdown] = useState(false);
  const localUserDropdownRef = useRef(null);

  // Use props if provided, otherwise use local state/ref
  const showUserDropdown =
    propShowUserDropdown !== undefined
      ? propShowUserDropdown
      : localShowUserDropdown;
  const setShowUserDropdown =
    propSetShowUserDropdown !== undefined
      ? propSetShowUserDropdown
      : setLocalShowUserDropdown;
  const userDropdownRef = propUserDropdownRef || localUserDropdownRef;

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      // Close dropdown before navigating
      setShowUserDropdown(false);
      // Small delay to ensure state update before navigation
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  };

  const handlePrimaryMenuToggle = () => {
    if (typeof onMenuToggle === "function") {
      onMenuToggle();
      return;
    }
    window.dispatchEvent(new Event("app:toggle-sidebar"));
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        // Check if the click was on the user button itself
        const userButton =
          userDropdownRef.current.querySelector(".user-button");
        if (userButton && userButton.contains(event.target)) {
          return;
        }
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowUserDropdown, showUserDropdown]);

  // Get and format username
  let username = currentUser || localStorage.getItem("username") || "User";

  // Format username properly (capitalize words and remove dots)
  if (username.includes(".")) {
    username = username
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  } else if (username !== "User") {
    username = username.charAt(0).toUpperCase() + username.slice(1);
  }

  const college = (localStorage.getItem("college") || "VP").toUpperCase();
  const institutionCode = (
    localStorage.getItem("institutionCode") ||
    college ||
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
  const userRole = localStorage.getItem("role") || "faculty";
  const isSuperAdmin = userRole === "superadmin";
  const isFaculty = userRole === "faculty";

  // Test dropdown state
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  return (
    <div className="header">
      <div className="header-left">
        {/* This button's onClick calls the function passed from App.jsx */}
        <button
          className={`menu-toggle ${hidePrimaryMenuToggleOnCompact ? "hide-on-compact" : ""}`}
          onClick={handlePrimaryMenuToggle}
        >
          <i className="bi bi-list"></i>
        </button>
        {/* Secondary menu toggle button for CIANN sidebar */}
        {onSecondaryMenuToggle && (
          <button
            className="secondary-menu-toggle"
            onClick={onSecondaryMenuToggle}
          >
            <i className="bi bi-layout-sidebar"></i>
          </button>
        )}
        <span className="logo" title={institutionName}>
          {institutionLogoUrl ? (
            <img
              src={institutionLogoUrl}
              alt={institutionName}
              className="institution-logo-image"
            />
          ) : (
            <span className="institution-logo-fallback">
              {institutionFallback}
            </span>
          )}
          <span className="institution-name-text">{institutionName}</span>
          {isFaculty && <span className="role-chip">Faculty</span>}
        </span>
      </div>
      <div className="header-right">
        {mobileHomePath && (
          <button
            className="mobile-home-button"
            onClick={() => navigate(mobileHomePath)}
            title="Go to Home"
          >
            <i className="bi bi-house-door"></i>
            <span>Home</span>
          </button>
        )}
        {isFaculty && (
          <button className="faculty-logout-button" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        )}
        {!isFaculty && (
          <div className="user-section" ref={userDropdownRef}>
            <button
              className="user-button"
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
              }}
              aria-expanded={showUserDropdown}
            >
              <span className="user-icon">👤</span>
              <span
                className="user-name"
                title={username}
                aria-label={`Logged in as ${username}`}
              >
                {isSuperAdmin ? `Super Admin (${username})` : username}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserDropdown && (
              <div
                className={`user-dropdown-menu ${
                  showUserDropdown ? "visible" : ""
                }`}
              >
                {isSuperAdmin && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowUserDropdown(false);
                      window.location.href = "/superadmin-dashboard";
                    }}
                  >
                    <i className="fas fa-user-shield"></i> Super Admin Panel
                  </button>
                )}
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
