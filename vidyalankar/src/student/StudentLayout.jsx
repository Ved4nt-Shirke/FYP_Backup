import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import "./StudentLayout.css";

const StudentLayout = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const sidebarRef = useRef(null);
  const dropdownRefs = {
    elibrary: useRef(null),
    mockTest: useRef(null),
  };

  // Get student info from localStorage
  const studentName = localStorage.getItem("username") || "Student";
  const college = localStorage.getItem("college") || "VP";

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
      
      // Close sidebar on mobile if click is outside and sidebar is visible
      const sidebar = document.querySelector('.student-sidebar');
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-visible') && !isInsideSidebar) {
        sidebar.classList.remove('mobile-visible');
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    // Close dropdowns
    setOpenDropdown(null);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.student-sidebar');
      if (sidebar && sidebar.classList.contains('mobile-visible')) {
        sidebar.classList.remove('mobile-visible');
      }
    }
  };

  return (
    <div className="student-dashboard">
      {/* Sidebar */}
      <div className="student-sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Student Portal</h2>
        </div>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <div className="menu-item" onClick={() => handleNavigation("/dashboard")}>
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div className="menu-item" onClick={() => handleNavigation("/study-material")}>
              <i className="bi bi-book"></i>
              <span>Study Material</span>
            </div>
          </li>
          
          {/* E-library with dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.elibrary}>
              <button
                className="dropdown-toggle"
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
                      className="dropdown-item" 
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
                      className="dropdown-item" 
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
                className="dropdown-toggle"
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
                      className="dropdown-item" 
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
                      className="dropdown-item" 
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
                      className="dropdown-item" 
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
          
          {/* Results */}
          <li className="sidebar-item">
            <div className="menu-item" onClick={() => handleNavigation("/results")}>
              <i className="bi bi-bar-chart"></i>
              <span>Results</span>
            </div>
          </li>
          
          {/* Notices */}
          <li className="sidebar-item">
            <div className="menu-item" onClick={() => handleNavigation("/notices")}>
              <i className="bi bi-bell"></i>
              <span>Notices</span>
            </div>
          </li>
        </ul>
      </div>
      {/* Mobile overlay */}
      <div className="mobile-sidebar-overlay" onClick={() => {
        const sidebar = document.querySelector('.student-sidebar');
        if (sidebar && sidebar.classList.contains('mobile-visible')) {
          sidebar.classList.remove('mobile-visible');
        }
      }}></div>

      {/* Main Content */}
      <div className="student-main-content">
        {/* Header with logout button */}
        <div className="student-header">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={() => {
              const sidebar = document.querySelector('.student-sidebar');
              if (sidebar) {
                sidebar.classList.toggle('mobile-visible');
              }
            }}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Student Portal</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{studentName}</span>
              <span className="college-info">({college})</span>
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