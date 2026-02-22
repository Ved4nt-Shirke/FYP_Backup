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
  const dropdownRefs = {
    elibrary: useRef(null),
    mockTest: useRef(null),
    practicalExam: useRef(null),
  };

  // Get student info from localStorage
  const studentName =
    localStorage.getItem("studentName") ||
    localStorage.getItem("username") ||
    "Student";
  const institutionCode = (
    localStorage.getItem("institutionCode") || localStorage.getItem("college") || "VP"
  ).toUpperCase();
  const institutionName = localStorage.getItem("institutionName") || institutionCode;
  const institutionLogoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const institutionFallback = getInstitutionInitials(institutionName, institutionCode);

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isInsideDropdown = false;
      let isInsideSidebar = false;
      
      // Check if click is inside dropdowns
      for (const ref in dropdownRefs) {
        if (
          dropdownRefs[ref].current &&
          dropdownRefs[ref].current.contains(event.target)
        ) {
          isInsideDropdown = true;
          break;
        }
      }
      
      // Check if click is inside sidebar
      if (sidebarRef.current && sidebarRef.current.contains(event.target)) {
        isInsideSidebar = true;
      }

      // Close dropdowns if click is outside
      if (!isInsideDropdown) {
        setOpenDropdown(null);
      }
      
      // Close sidebar on mobile if click is outside
      if (window.innerWidth <= 768 && isSidebarOpen && !isInsideSidebar) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

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
    setOpenDropdown(null);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const isActivePath = (path) => location.pathname === path;
  const isDropdownActive = (paths) => paths.includes(location.pathname);

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className={`student-sidebar ${isSidebarOpen ? "mobile-visible" : ""}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="student-brand">
            {institutionLogoUrl ? (
              <img src={institutionLogoUrl} alt={institutionName} className="student-brand-logo" />
            ) : (
              <span className="student-brand-fallback">{institutionFallback}</span>
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
          
          {/* E-library with dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.elibrary}>
              <button
                className={`dropdown-toggle ${isDropdownActive(["/elibrary/coursewise", "/elibrary/search"]) ? "active" : ""}`}
                onClick={() => handleDropdownToggle("elibrary")}
              >
                <i className="bi bi-bookshelf"></i>
                <span>E-library</span>
                <i className={`bi bi-chevron-${openDropdown === "elibrary" ? "up" : "down"}`}></i>
              </button>
              {openDropdown === "elibrary" && (
                <ul className="dropdown-menu">
                  <li>
                    <div 
                      className={`dropdown-item ${isActivePath("/elibrary/coursewise") ? "active" : ""}`}
                      onClick={() => {
                        handleNavigation("/elibrary/coursewise");
                        setOpenDropdown(null);
                      }}
                    >
                      <i className="bi bi-collection"></i>
                      <span>Coursewise</span>
                    </div>
                  </li>
                  <li>
                    <div 
                      className={`dropdown-item ${isActivePath("/elibrary/search") ? "active" : ""}`}
                      onClick={() => {
                        handleNavigation("/elibrary/search");
                        setOpenDropdown(null);
                      }}
                    >
                      <i className="bi bi-search"></i>
                      <span>Search</span>
                    </div>
                  </li>

                </ul>
              )}
            </div>
          </li>
          
          {/* Online Exams with Mock Test dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.mockTest}>
              <button
                className={`dropdown-toggle ${isDropdownActive(["/mock-test/exam-list", "/mock-test/exam-result", "/mock-test/exams"]) ? "active" : ""}`}
                onClick={() => handleDropdownToggle("mockTest")}
              >
                <i className="bi bi-laptop"></i>
                <span>Online Exams</span>
                <i className={`bi bi-chevron-${openDropdown === "mockTest" ? "up" : "down"}`}></i>
              </button>
              {openDropdown === "mockTest" && (
                <ul className="dropdown-menu">
                  <li>
                    <div 
                      className={`dropdown-item ${isActivePath("/mock-test/exam-list") ? "active" : ""}`}
                      onClick={() => {
                        handleNavigation("/mock-test/exam-list");
                        setOpenDropdown(null);
                      }}
                    >
                      <i className="bi bi-list-task"></i>
                      <span>Exam List</span>
                    </div>
                  </li>
                  <li>
                    <div 
                      className={`dropdown-item ${isActivePath("/mock-test/exam-result") ? "active" : ""}`}
                      onClick={() => {
                        handleNavigation("/mock-test/exam-result");
                        setOpenDropdown(null);
                      }}
                    >
                      <i className="bi bi-bar-chart"></i>
                      <span>Exam Result</span>
                    </div>
                  </li>
                  <li>
                    <div 
                      className={`dropdown-item ${isActivePath("/mock-test/exams") ? "active" : ""}`}
                      onClick={() => {
                        handleNavigation("/mock-test/exams");
                        setOpenDropdown(null);
                      }}
                    >
                      <i className="bi bi-calendar-event"></i>
                      <span>Upcoming Exams</span>
                    </div>
                  </li>
                </ul>
              )}
            </div>
          </li>
          
          {/* Practical Exams */}
          <li className="sidebar-item">
            <div
              className={`menu-item ${isActivePath("/practical-exams") ? "active" : ""}`}
              onClick={() => handleNavigation("/practical-exams")}
            >
              <i className="bi bi-file-earmark-check"></i>
              <span>Practical Exams</span>
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
            <button className="mobile-menu-toggle" onClick={() => {
              setIsSidebarOpen((prev) => !prev);
            }}>
              <i className="bi bi-list"></i>
            </button>
            <div className="student-header-brand">
              {institutionLogoUrl ? (
                <img src={institutionLogoUrl} alt={institutionName} className="student-header-logo" />
              ) : (
                <span className="student-header-fallback">{institutionFallback}</span>
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