import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./SuperAdminSidebar.css";

const SuperAdminSidebar = ({ isSidebarVisible, setIsSidebarVisible }) => {
  const location = useLocation();
  const isMobileViewport = window.innerWidth < 992;

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const handleLinkClick = () => {
    if (window.innerWidth < 992) {
      setIsSidebarVisible(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarVisible && isMobileViewport && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setIsSidebarVisible(false)}
          aria-hidden="true"
        ></div>
      )}

      {
        <nav
          className={`sidebar ${isSidebarVisible ? "visible" : ""}`}
          aria-label="Super admin navigation"
        >
          {/* Header is hidden via CSS but kept for structure if needed */}
          <div className="sidebar-header">
            <h4>Super Admin</h4>
          </div>

          <ul className="sidebar-nav">
            <li>
              <Link
                to="/superadmin-dashboard"
                className={isActive("/superadmin-dashboard")}
                onClick={handleLinkClick}
              >
                <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
                <span>Dashboard</span>
              </Link>
            </li>

            <li>
              <Link
                to="/superadmin-create-institution"
                className={isActive("/superadmin-create-institution")}
                onClick={handleLinkClick}
              >
                <i className="fas fa-university" aria-hidden="true"></i>
                <span>Create Institution</span>
              </Link>
            </li>

            <li>
              <Link
                to="/superadmin-view-institutions"
                className={isActive("/superadmin-view-institutions")}
                onClick={handleLinkClick}
              >
                <i className="fas fa-list" aria-hidden="true"></i>
                <span>View Institutions</span>
              </Link>
            </li>
          </ul>
        </nav>
      }

      {/* Mobile Menu Toggle Button */}
      <button
        className="menu-toggle"
        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
        aria-label="Toggle menu"
      >
        <i className="fas fa-bars" aria-hidden="true"></i>
      </button>
    </>
  );
};

export default SuperAdminSidebar;
