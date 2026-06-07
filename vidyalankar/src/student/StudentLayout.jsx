import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import "./StudentLayout.css";

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Get student info from localStorage
  const studentName =
    localStorage.getItem("studentName") ||
    localStorage.getItem("username") ||
    "Student";
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isInsideSidebar = false;

      // Check if click is inside sidebar
      if (sidebarRef.current && sidebarRef.current.contains(event.target)) {
        isInsideSidebar = true;
      }

      // Close sidebar on mobile if click is outside
      if (window.innerWidth <= 768 && isSidebarOpen && !isInsideSidebar) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      localStorage.removeItem("college");
      localStorage.removeItem("role");
      navigate("/login");
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div
        className={`student-sidebar ${isSidebarOpen ? "mobile-visible" : ""}`}
        ref={sidebarRef}
      >
        <div className="sidebar-header">
          <div className="student-brand">
            {institutionLogoUrl ? (
              <img
                src={institutionLogoUrl}
                alt={institutionName}
                className="student-brand-logo"
              />
            ) : (
              <span className="student-brand-fallback">
                {institutionFallback}
              </span>
            )}
            <div>
              <h2 className="sidebar-title">{institutionName}</h2>
              <p className="student-brand-subtitle">Student Portal</p>
            </div>
          </div>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/dashboard") ? "active" : ""}`}
              onClick={() => handleNavigation("/dashboard")}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/study-material") ? "active" : ""}`}
              onClick={() => handleNavigation("/study-material")}
            >
              <i className="bi bi-book"></i>
              <span>Study Material</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/messages") ? "active" : ""}`}
              onClick={() => handleNavigation("/messages")}
            >
              <i className="bi bi-chat-dots"></i>
              <span>Messages</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/timetable") ? "active" : ""}`}
              onClick={() => handleNavigation("/timetable")}
            >
              <i className="bi bi-calendar-week"></i>
              <span>Timetable</span>
            </div>
          </li>
          {/* Practical Exams */}
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/mock-exams") ? "active" : ""}`}
              onClick={() => handleNavigation("/mock-exams")}
            >
              <i className="bi bi-clipboard2-pulse"></i>
              <span>Mock Exams</span>
            </div>
          </li>

          {/* Results */}
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/results") ? "active" : ""}`}
              onClick={() => handleNavigation("/results")}
            >
              <i className="bi bi-bar-chart"></i>
              <span>Results</span>
            </div>
          </li>

          {/* Notices */}
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/notices") ? "active" : ""}`}
              onClick={() => handleNavigation("/notices")}
            >
              <i className="bi bi-bell"></i>
              <span>Notices</span>
            </div>
          </li>
        </ul>
      </div>
      {/* Mobile overlay */}
      <div
        className={`mobile-sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <div className="student-main-content">
        {/* Header with logout button */}
        <div className="student-header">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => {
                setIsSidebarOpen((prev) => !prev);
              }}
            >
              <i className="bi bi-list"></i>
            </button>
            <div className="student-header-brand">
              {institutionLogoUrl ? (
                <img
                  src={institutionLogoUrl}
                  alt={institutionName}
                  className="student-header-logo"
                />
              ) : (
                <span className="student-header-fallback">
                  {institutionFallback}
                </span>
              )}
              <h1>{institutionName}</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{studentName}</span>
              <span className="college-info">({institutionCode})</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Page Content - This is where child routes will be rendered */}
        <div className="student-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
