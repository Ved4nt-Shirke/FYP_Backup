import React from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import "./OfficeSidebar.css";

const OfficeSidebar = ({
  isVisible,
  setIsVisible,
  onLogout,
  staffName = "Office Staff",
  currentTab,
  onTabChange,
}) => {
  const navigate = useNavigate();
  const institutionCode = (
    localStorage.getItem("institutionCode") ||
    localStorage.getItem("college") ||
    "VP"
  ).toUpperCase();
  const institutionName =
    localStorage.getItem("institutionName") || institutionCode;

  const displayUsername =
    localStorage.getItem("username") ||
    localStorage.getItem("name") ||
    staffName;

  const institutionLogoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const institutionFallback = getInstitutionInitials(
    institutionName,
    institutionCode,
  );

  const menuItems = [
    {
      id: "upload",
      label: "Upload Students",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="nav-svg-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tab: "upload",
    },
    {
      id: "manage",
      label: "Manage Students",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="nav-svg-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0012 20c-1.353 0-2.64-.236-3.83-.664v-.109c0-1.113.285-2.16.786-3.07M7 10a4 4 0 11-8 0 4 4 0 018 0zm0 4.882a6.003 6.003 0 00-4 5.659v.27c0 .504.404.908.908.908h10.184a.908.908 0 00.908-.908v-.27a6.003 6.003 0 00-4-5.659M7 10a4 4 0 00-4-4M7 10a4 4 0 014-4" />
        </svg>
      ),
      tab: "manage",
    },
    {
      id: "notices",
      label: "Notices",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="nav-svg-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ),
      tab: "notices",
    },
  ];

  const handleNavigation = (item) => {
    if (item.tab && onTabChange) {
      onTabChange(item.tab);
    }
    if (window.innerWidth <= 768) {
      setIsVisible(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isVisible && (
        <button className="office-mobile-sidebar-toggle" onClick={() => setIsVisible(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="mobile-toggle-svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isVisible && window.innerWidth <= 768 && (
        <div
          className="office-sidebar-overlay"
          onClick={() => setIsVisible(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`office-sidebar ${isVisible ? "visible" : "collapsed"}`}>
        {/* Logo/Brand Section */}
        <div className="sidebar-brand-wrapper">
          <div className="brand-inner">
            {institutionLogoUrl ? (
              <img
                src={institutionLogoUrl}
                alt={institutionName}
                className="brand-logo-img"
              />
            ) : (
              <div className="brand-logo-fallback">{institutionFallback}</div>
            )}
            <div className="brand-details">
              <span className="brand-name">Office Panel</span>
              <span className="brand-subtext">{institutionName}</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar-badge">
            {displayUsername.charAt(0).toUpperCase()}
          </div>
          <div className="user-text-info">
            <span className="user-display-name">{displayUsername}</span>
            <span className="user-role-label">Staff Member</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav-menu">
          <div className="menu-group-label">Student Admin</div>
          <div className="menu-items-list">
            {menuItems.map((item) => {
              const isActive = currentTab === item.tab;
              return (
                <button
                  key={item.id}
                  className={`menu-item-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleNavigation(item)}
                >
                  <span className="menu-item-icon">{item.icon}</span>
                  <span className="menu-item-text">{item.label}</span>
                  {isActive && <span className="active-dot" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="sidebar-footer-actions">
          <button className="logout-action-btn" onClick={handleLogoutClick}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="logout-svg-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="logout-btn-text">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default OfficeSidebar;
