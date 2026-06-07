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
      icon: "📤",
      tab: "upload",
      section: "Student Management",
    },
    {
      id: "manage",
      label: "Manage Students",
      icon: "👥",
      tab: "manage",
      section: "Student Management",
    },
    {
      id: "notices",
      label: "Notices",
      icon: "📢",
      tab: "notices",
      section: "Communication",
    },
  ];

  const handleNavigation = (item) => {
    if (item.tab && onTabChange) {
      onTabChange(item.tab);
    } else if (item.path) {
      navigate(item.path);
    }
    if (window.innerWidth <= 768) {
      setIsVisible(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isVisible && window.innerWidth <= 768 && (
        <div
          className="office-sidebar-overlay"
          onClick={() => setIsVisible(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`office-sidebar ${isVisible ? "visible" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {institutionLogoUrl ? (
              <img
                src={institutionLogoUrl}
                alt={institutionName}
                className="sidebar-logo-image"
              />
            ) : (
              <div className="sidebar-logo-fallback">{institutionFallback}</div>
            )}
            <div className="sidebar-logo-text">
              <p className="sidebar-title">Office Portal</p>
            </div>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setIsVisible(false)}
            title="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">
            {staffName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-details">
            <p className="sidebar-user-name">{staffName}</p>
            <p className="sidebar-user-role">Office Staff</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            if (item.type === "divider") {
              return <div key={item.id} className="sidebar-divider"></div>;
            }

            const showSectionLabel =
              index === 0 || menuItems[index - 1].type === "divider";

            const isActive = currentTab && item.tab && currentTab === item.tab;

            return (
              <div key={item.id}>
                {showSectionLabel && item.section && (
                  <div className="sidebar-section-label">{item.section}</div>
                )}
                <button
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleNavigation(item)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn logout-btn" onClick={onLogout}>
            <span role="img" aria-label="logout">
              🚪
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default OfficeSidebar;
