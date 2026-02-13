import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isSidebarVisible, setIsSidebarVisible, ciannData }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarRef = useRef(null);
  const dropdownRefs = {
    ciann: useRef(null),
    attendance: useRef(null),
    course: useRef(null),
    assessment: useRef(null),
    ct: useRef(null),
    ptMicroProject: useRef(null),
  };

  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isInsideDropdown = false;
      for (const ref in dropdownRefs) {
        if (
          dropdownRefs[ref].current &&
          dropdownRefs[ref].current.contains(event.target)
        ) {
          isInsideDropdown = true;
          break;
        }
      }

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !isInsideDropdown
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRefs]);

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleCiannSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Create CIANN") {
      navigate("/create-ciann");
    } else if (option === "Edit CIANN") {
      navigate("/edit-ciann");
    } else if (option === "Print CIANN") {
      alert("Print CIANN clicked");
    }
  };

  const handleAttendanceSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Mark Attendance") {
      navigate("/mark-attendance");
    } else if (option === "View Attendance") {
      navigate("/view-attendance");
    } else if (option === "Edit Attendance") {
      navigate("/edit-attendance");
    } else if (option === "Defaultters") {
      navigate("/defaulter");
    } else if (option === "Summary") {
      navigate("/summary-cards");
    }
  };

  const handleCourseSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Chapters") {
      navigate("/chapters");
    } else if (option === "Experiment") {
      navigate("/experiment");
    }
  };

  const handleAssessmentSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Assess") {
      navigate("/assess-ciann");
    } else if (option === "Edit") {
      navigate("/edit-card");
    } else if (option === "Studentwise (Defaulters)") {
      navigate("/studentwise-defaulters");
    } else if (option === "View") {
      navigate("/view-assessment");
    }
  };

  const handleCtSelect = (option) => {
    setOpenDropdown(null);
    if (option === "CT1") {
      navigate("/ct/ct1");
    } else if (option === "CT2") {
      navigate("/ct/ct2");
    }
  };

  const handlePtMicroProjectSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Microproject") {
      navigate("/pt-microproject/microproject");
    }
  };

  const handleItemClick = (action) => {
    setOpenDropdown(null);
    if (action === "dashboard") {
      navigate("/dashboard");
    } else {
      alert(`${action} clicked`);
    }
  };

  const sidebarClasses = `sidebar ${
    isSidebarVisible ? "visible" : "collapsed"
  } ${isMobile ? "mobile" : ""}`;

  return (
    <>
      {isMobile && isSidebarVisible && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarVisible(false)}
        ></div>
      )}
      <div
        ref={sidebarRef}
        className={sidebarClasses}
        style={{ backgroundColor: "var(--app-header-bg)" }}
      >
        <div className="sidebar-header">
          {(() => {
            const raw = (localStorage.getItem("college") || "VP").toUpperCase();
            const title =
              raw === "VIT"
                ? "VIT"
                : raw === "VSIT"
                ? "VSIT"
                : "VP Polytechnic";
            return <h2 className="sidebar-title">{title}</h2>;
          })()}
          {isMobile && (
            <button
              className="sidebar-close-btn"
              onClick={() => setIsSidebarVisible(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <ul className="sidebar-menu list-unstyled">
          <li
            className="sidebar-item active"
            onClick={() => handleItemClick("dashboard")}
          >
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ciann}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("ciann")}
              >
                <i className="bi bi-file-earmark-text"></i>
                <span>CIANN</span>
              </button>
              {openDropdown === "ciann" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCiannSelect("Create CIANN");
                      }}
                    >
                      <i className="bi bi-plus-square"></i> Create CIANN
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCiannSelect("Edit CIANN");
                      }}
                    >
                      <i className="bi bi-pencil-square"></i> Edit CIANN
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCiannSelect("Print CIANN");
                      }}
                    >
                      <i className="bi bi-printer-fill"></i> Print CIANN
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.attendance}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("attendance")}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Attendance</span>
              </button>
              {openDropdown === "attendance" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAttendanceSelect("Mark Attendance");
                      }}
                    >
                      <i className="bi bi-check-circle-fill"></i> Mark
                      Attendance
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAttendanceSelect("Edit Attendance");
                      }}
                    >
                      <i className="bi bi-pencil-square"></i> Edit Attendance
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAttendanceSelect("View Attendance");
                      }}
                    >
                      <i className="bi bi-eye-fill"></i> View Attendance
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAttendanceSelect("Summary");
                      }}
                    >
                      <i className="bi bi-file-earmark-text"></i> Summary
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAttendanceSelect("Defaultters");
                      }}
                    >
                      <i className="bi bi-exclamation-triangle"></i> Defaultters
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.course}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("course")}
              >
                <i className="bi bi-book"></i>
                <span>Course</span>
              </button>
              {openDropdown === "course" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCourseSelect("Chapters");
                      }}
                    >
                      <i className="bi bi-list-ol"></i> Chapters
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCourseSelect("Experiment");
                      }}
                    >
                      <i className="bi bi-flask"></i> Experiment
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.assessment}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("assessment")}
              >
                <i className="bi bi-journal-check"></i>
                <span>Assessment</span>
              </button>
              {openDropdown === "assessment" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssessmentSelect("Assess");
                      }}
                    >
                      <i className="bi bi-pencil"></i> Assess
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssessmentSelect("Edit");
                      }}
                    >
                      <i className="bi bi-pencil-square"></i> Edit
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssessmentSelect("Studentwise (Defaulters)");
                      }}
                    >
                      <i className="bi bi-person-x"></i> Studentwise
                      (Defaulters)
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAssessmentSelect("View");
                      }}
                    >
                      <i className="bi bi-eye"></i> View
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ct}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("ct")}
              >
                <i className="bi bi-clipboard-check"></i>
                <span>CT</span>
              </button>
              {openDropdown === "ct" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCtSelect("CT1");
                      }}
                    >
                      <i className="bi bi-1-circle"></i> CT1
                    </a>
                  </li>
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCtSelect("CT2");
                      }}
                    >
                      <i className="bi bi-2-circle"></i> CT2
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ptMicroProject}>
              <button
                className="btn dropdown-toggle dropdown-header w-100 text-start"
                type="button"
                onClick={() => handleDropdownToggle("ptMicroProject")}
              >
                <i className="bi bi-diagram-3"></i>
                <span>PT Microproject</span>
              </button>
              {openDropdown === "ptMicroProject" && (
                <ul className="dropdown-menu show">
                  <li>
                    <a
                      className="dropdown-item d-flex align-items-center gap-2"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePtMicroProjectSelect("Microproject");
                      }}
                    >
                      <i className="bi bi-diagram-3"></i> Microproject
                    </a>
                  </li>
                </ul>
              )}
            </div>
          </li>
          {["MSBTE Formats", "Practical Exam", "Mock Exams"].map(
            (item, index) => (
              <li
                key={index}
                className="sidebar-item"
                onClick={() => handleItemClick(item)}
              >
                <i className="bi bi-gear"></i>
                <span>{item}</span>
              </li>
            )
          )}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
