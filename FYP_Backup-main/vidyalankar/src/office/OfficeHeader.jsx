import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OfficeHeader.css";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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

  const tabLabels = {
    upload: "Upload Students",
    manage: "Manage Students",
    notices: "Notices",
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const activeLabel = currentTab ? tabLabels[currentTab] || "Office Portal" : "Office Portal";

  return (
    <header className="office-top-header">
      <div className="header-inner-content">
        {/* Left Section: Nav toggle & Breadcrumbs */}
        <div className="header-left-pane">
          <button
            className="header-mobile-toggle-btn"
            onClick={onMenuToggle}
            aria-label="Toggle Navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="mobile-toggle-svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          
          <div className="header-breadcrumbs">
            <span className="breadcrumb-root">Portal</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{activeLabel}</span>
          </div>
        </div>

        {/* Center Section: Compact Search (Visual only for Admin Dashboard look) */}
        <div className="header-center-pane">
          <div className="header-mock-search">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="search-svg-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
            </svg>
            <input type="text" placeholder="Search anything..." disabled className="mock-search-input" />
            <kbd className="mock-search-kbd">⌘K</kbd>
          </div>
        </div>

        {/* Right Section: Actions & User Dropdown */}
        <div className="header-right-pane">
          {/* Notifications */}
          <button className="topbar-icon-action-btn" aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="topbar-notif-svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.7c0 2.01-.37 3.96-.935 5.71a23.848 23.848 0 005.454 1.31M16.074 6L16.2 6a2.25 2.25 0 013.183 3.183l-.12.12M8 12h.008v.008H8V12zm0-4h.008v.008H8V8zm0 8h.008v.008H8V16zm4 0h.008v.008H12V16zm0-4h.008v.008H12V12zm0-4h.008v.008H12V8zm4 0h.008v.008H16V8zm0 4h.008v.008H16V12z" />
            </svg>
            {notifCount > 0 && <span className="topbar-notif-indicator" />}
          </button>

          <div className="pane-vertical-divider" />

          {/* Profile Selector */}
          <div className="profile-dropdown-wrapper">
            <button
              className="profile-topbar-trigger-btn"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <div className="profile-avatar-initials">
                {staffName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-trigger-label-group">
                <span className="profile-trigger-username">{staffName}</span>
                <span className="profile-trigger-sub">{institutionCode} staff</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`profile-dropdown-chevron-svg ${showUserMenu ? "open" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="profile-dropdown-overlay-backdrop"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="profile-dropdown-menu-list">
                  <div className="dropdown-menu-user-header">
                    <p className="user-header-greeting">{getGreeting()},</p>
                    <p className="user-header-name">{staffName}</p>
                    <p className="user-header-role">Office staff member</p>
                  </div>
                  <div className="dropdown-menu-separator" />
                  <button
                    className="dropdown-menu-item-btn logout"
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="dropdown-menu-icon-svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    <span>Sign out</span>
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
