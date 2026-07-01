import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CiaanUtils } from "../utils/ciannUtils";
import "./Sidebar.css";

const Sidebar = ({
  isSidebarVisible,
  setIsSidebarVisible,
  CiaanData,
  disableOnCompact = false,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMsbteSections, setOpenMsbteSections] = useState({
    k3: false,
    k4: false,
    saTh: false,
    k8: false,
    k9: false,
    k7: false,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [pendingCiaanRequests, setPendingCiaanRequests] = useState(0);

  const sidebarRef = useRef(null);
  const dropdownRefs = {
    Ciaan: useRef(null),
    attendance: useRef(null),
    assessment: useRef(null),
    ct: useRef(null),
    ptMicroProject: useRef(null),
    msbte: useRef(null),
    mockExam: useRef(null),
    practicalExams: useRef(null),
  };

  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("role") || "faculty";
  const isFaculty = userRole === "faculty" || userRole === "hod" || userRole === "academic_coordinator";
  const isHodOrCoordinator = userRole === "hod" || userRole === "academic_coordinator";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 769);
      setIsCompact(window.innerWidth <= 1024);
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

  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
  }, [location.pathname, isSidebarVisible]);

  useEffect(() => {
    if (!openDropdown || !sidebarRef.current) return;

    const targetRef = dropdownRefs[openDropdown];
    if (!targetRef?.current) return;

    requestAnimationFrame(() => {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [openDropdown]);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!isFaculty) {
        setPendingCiaanRequests(0);
        return;
      }

      try {
        const response = await CiaanUtils.getIncomingShareRequests();
        setPendingCiaanRequests(
          Array.isArray(response?.incoming) ? response.incoming.length : 0,
        );
      } catch (error) {
        setPendingCiaanRequests(0);
      }
    };

    fetchPendingRequests();
  }, [isFaculty, location.pathname]);

  useEffect(() => {
    const path = location.pathname;

    // Map paths to their corresponding dropdowns
    if (["/create-Ciaan", "/edit-Ciaan", "/summary-cards"].includes(path) || path.startsWith("/create-Ciaan") || path.startsWith("/edit-Ciaan")) {
      setOpenDropdown("CIAAN");
    } else if (path.startsWith("/faculty/mock-exams")) {
      setOpenDropdown("mockExam");
    } else if (
      path.startsWith("/smart-attendance") ||
      path.startsWith("/mark-attendance") ||
      path.startsWith("/view-attendance") ||
      path.startsWith("/edit-attendance") ||
      path.startsWith("/defaulter") ||
      path.startsWith("/attendance-summary-cards") ||
      path.startsWith("/theory-Ciaan-cards") ||
      path.startsWith("/extra-theory") ||
      path.startsWith("/extra-practical") ||
      path.startsWith("/tutorial-Ciaan") ||
      path.startsWith("/practical-Ciaan") ||
      path.startsWith("/prac-form") ||
      path.startsWith("/theory-edit") ||
      path.startsWith("/final-attendance") ||
      path.startsWith("/student-extra-attendance") ||
      path.startsWith("/student-attendance") ||
      path.startsWith("/edit-attendance1") ||
      path.startsWith("/edit-attendance2") ||
      path.startsWith("/edit-individual-attendance") ||
      path.startsWith("/edit-extra-theory-attendance") ||
      path.startsWith("/edit-practical-attendance") ||
      path.startsWith("/edit-tutorial-attendance") ||
      path.startsWith("/edit-existing-practical-attendance") ||
      path.startsWith("/view-attend") ||
      path.startsWith("/view-practical") ||
      path.startsWith("/view-extra-practical") ||
      path.startsWith("/view-tutorial-attendance")
    ) {
      setOpenDropdown("attendance");
    } else if (
      path.startsWith("/assess-Ciaan") ||
      path.startsWith("/edit-card") ||
      path.startsWith("/studentwise-defaulters") ||
      path.startsWith("/view-assessment") ||
      path.startsWith("/assessment-") ||
      path.startsWith("/view-assessment-") ||
      path.startsWith("/edit-assess") ||
      path.startsWith("/edit-prog-assess") ||
      path.startsWith("/studentwise-select") ||
      path.startsWith("/studentwise-assess") ||
      path.startsWith("/studentwise-setup")
    ) {
      setOpenDropdown("assessment");
    } else if (path.startsWith("/ct-Ciaans") || path.startsWith("/ct-dashboard")) {
      setOpenDropdown("ct");
    } else if (path.startsWith("/pt-microproject")) {
      setOpenDropdown("ptMicroProject");
    } else if (path.startsWith("/msbte")) {
      setOpenDropdown("msbte");

      // Auto-expand specific MSBTE sections based on path query or sub-path
      if (path.includes("fa-pr-k3")) {
        setOpenMsbteSections(prev => ({ ...prev, k3: true }));
      } else if (path.includes("sa-pr-k4")) {
        setOpenMsbteSections(prev => ({ ...prev, k4: true }));
      } else if (path.includes("sa-th")) {
        setOpenMsbteSections(prev => ({ ...prev, saTh: true }));
      } else if (path.includes("industrial-visit")) {
        setOpenMsbteSections(prev => ({ ...prev, k8: true }));
      } else if (path.includes("expert-lecture")) {
        setOpenMsbteSections(prev => ({ ...prev, k9: true }));
      } else if (path.includes("term-analysis")) {
        setOpenMsbteSections(prev => ({ ...prev, k7: true }));
      } else if (path.includes("/k7/")) {
        setOpenMsbteSections(prev => ({ ...prev, k7: true }));
      }
    } else if (path.startsWith("/faculty/practical-exams")) {
      setOpenDropdown("practicalExams");
    }
  }, [location.pathname]);

  if (disableOnCompact && isCompact) {
    return null;
  }

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const navigateAndClose = (path) => {
    navigate(path);
    if (window.innerWidth <= 1024) {
      setIsSidebarVisible(false);
    }
  };

  const handleCiaanSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Create CIAAN") {
      navigateAndClose("/create-Ciaan");
    } else if (option === "Edit CIAAN") {
      navigateAndClose("/edit-Ciaan");
    } else if (option === "Print Ciaan") {
      navigateAndClose("/summary-cards");
    }
  };

  const handleAttendanceSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Smart Hub") {
      navigateAndClose("/smart-attendance");
    } else if (option === "Mark Attendance") {
      navigateAndClose("/mark-attendance");
    } else if (option === "View Attendance") {
      navigateAndClose("/view-attendance");
    } else if (option === "Edit Attendance") {
      navigateAndClose("/edit-attendance");
    } else if (option === "Defaultters") {
      navigateAndClose("/defaulter");
    } else if (option === "Summary") {
      navigateAndClose("/attendance-summary-cards");
    }
  };

  const handleAssessmentSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Assess") {
      navigateAndClose("/assess-Ciaan");
    } else if (option === "Edit") {
      navigateAndClose("/edit-card");
    } else if (option === "Studentwise (Defaulters)") {
      navigateAndClose("/studentwise-defaulters");
    } else if (option === "View") {
      navigateAndClose("/view-assessment");
    }
  };

  const handleCtSelect = (option) => {
    setOpenDropdown(null);
    if (option === "CT1") {
      navigateAndClose("/ct-Ciaans");
    } else if (option === "CT2") {
      navigateAndClose("/ct-Ciaans");
    }
  };

  const handlePtMicroProjectSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Microproject") {
      navigateAndClose("/pt-microproject/microproject");
    } else if (option === "Dashboard") {
      navigateAndClose("/pt-microproject/dashboard");
    }
  };

  const handleMSBTESelect = (option) => {
    if (option === "FA-PR-K3 Generate") {
      navigateAndClose("/msbte/fa-pr-k3/Ciaans");
    } else if (option === "FA-TH-K5 Generate") {
      navigateAndClose("/msbte/fa-th-k5/Ciaans");
    } else if (option === "SA-PR-K4 Generate") {
      navigateAndClose("/msbte/sa-pr-k4/Ciaans?mode=generate");
    } else if (option === "SA-PR-K4 Edit") {
      navigateAndClose("/msbte/sa-pr-k4/Ciaans?mode=edit");
    } else if (option === "SA-PR-K4 Print") {
      navigateAndClose("/msbte/sa-pr-k4/Ciaans?mode=print");
    } else if (option === "SA-TH Generate") {
      navigateAndClose("/msbte/sa-th/Ciaans?mode=generate");
    } else if (option === "SA-TH Edit") {
      navigateAndClose("/msbte/sa-th/Ciaans?mode=edit");
    } else if (option === "SA-TH Print") {
      navigateAndClose("/msbte/sa-th/Ciaans?mode=print");
    } else if (option === "K8 Generate") {
      navigateAndClose("/msbte/industrial-visit/k8/generate");
    } else if (option === "K8 Edit") {
      navigateAndClose("/msbte/industrial-visit/k8/edit");
    } else if (option === "K8 Print") {
      navigateAndClose("/msbte/industrial-visit/k8/print");
    } else if (option === "K9 Generate") {
      navigateAndClose("/msbte/expert-lecture/k9/generate");
    } else if (option === "K9 Edit") {
      navigateAndClose("/msbte/expert-lecture/k9/edit");
    } else if (option === "K9 Print") {
      navigateAndClose("/msbte/expert-lecture/k9/print");
    } else if (option === "Attendance Report") {
      navigateAndClose("/msbte/attendance");
    } else if (option === "Industrial Visit K8") {
      navigateAndClose("/msbte/industrial-visit/k8");
    } else if (option === "Expert Lecture K9") {
      navigateAndClose("/msbte/expert-lecture/k9");
    } else if (option === "Term Analysis K7") {
      navigateAndClose("/msbte/term-analysis");
    }
  };

  const toggleMsbteSection = (section) => {
    setOpenMsbteSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePracticalExamSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Manage") {
      navigateAndClose("/faculty/practical-exams");
    } else if (option === "Add Exam") {
      navigateAndClose("/faculty/practical-exams/add");
    } else if (option === "View/Edit") {
      navigateAndClose("/faculty/practical-exams/manage");
    } else if (option === "Status Control") {
      navigateAndClose("/faculty/practical-exams/status");
    }
  };

  const handleMockExamSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Create Exam") {
      navigateAndClose("/faculty/mock-exams/create");
    } else if (option === "Manage") {
      navigateAndClose("/faculty/mock-exams");
    } else if (option === "Results") {
      navigateAndClose("/faculty/mock-exams/results");
    }
  };

  const handleItemClick = (action) => {
    if (action === "MSBTE Formats") {
      handleDropdownToggle("msbte");
    } else if (action === "dashboard") {
      navigateAndClose("/dashboard");
    } else if (action === "faculty-study-material") {
      navigateAndClose("/faculty/study-material");
    } else if (action === "student-timetable") {
      navigateAndClose("/faculty/student-timetable");
    } else if (action === "faculty-notices") {
      navigateAndClose("/faculty/notices");
    } else {
      alert(`${action} clicked`);
    }
  };

  const sidebarClasses = `sidebar main-sidebar ${isSidebarVisible ? "visible" : "collapsed"
    } ${isMobile ? "mobile" : ""}`;

  const isRouteActive = (paths) =>
    paths.some(
      (path) =>
        location.pathname === path || location.pathname.startsWith(`${path}/`),
    );

  return (
    <>
      {isMobile && isSidebarVisible && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarVisible(false)}
          onTouchStart={() => setIsSidebarVisible(false)}
        ></div>
      )}
      <div ref={sidebarRef} className={sidebarClasses}>
        {isMobile && (
          <div className="sidebar-header">
            <button
              className="sidebar-close-btn"
              onClick={() => setIsSidebarVisible(false)}
              onTouchStart={() => setIsSidebarVisible(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        <ul className="sidebar-menu list-unstyled">
          <li className="sidebar-section-label">MAIN</li>
          <li
            className={`sidebar-item sidebar-link-item ${isRouteActive(["/dashboard"]) ? "active" : ""
              }`}
            onClick={() => handleItemClick("dashboard")}
          >
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li
            className={`sidebar-item sidebar-link-item ${isRouteActive(["/faculty/student-timetable"]) ? "active" : ""
              }`}
            onClick={() => handleItemClick("student-timetable")}
          >
            <i className="bi bi-calendar-week"></i>
            <span>Student Timetable</span>
          </li>
          <li
            className={`sidebar-item sidebar-link-item ${isRouteActive(["/faculty/study-material"]) ? "active" : ""
              }`}
            onClick={() => handleItemClick("faculty-study-material")}
          >
            <i className="bi bi-journal-bookmark"></i>
            <span>Study Material</span>
          </li>
          <li
            className={`sidebar-item sidebar-link-item ${isRouteActive(["/faculty/notices"]) ? "active" : ""
              }`}
            onClick={() => handleItemClick("faculty-notices")}
          >
            <i className="bi bi-megaphone"></i>
            <span>Notice Board</span>
          </li>
          <li className="sidebar-section-label">ACADEMIC</li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.Ciaan}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "CIAAN" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("CIAAN")}
              >
                <i className="bi bi-file-earmark-text"></i>
                <span>CIAAN</span>
                {pendingCiaanRequests > 0 && (
                  <span
                    className="sidebar-notification-badge"
                    title={`${pendingCiaanRequests} pending Ciaan share request(s)`}
                  >
                    {pendingCiaanRequests}
                  </span>
                )}
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "CIAAN" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/create-Ciaan" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCiaanSelect("Create CIAAN");
                    }}
                  >
                    <i className="bi bi-plus-square"></i> Create CIAAN
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/edit-Ciaan" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCiaanSelect("Edit CIAAN");
                    }}
                  >
                    <i className="bi bi-pencil-square"></i> Edit CIAAN
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/summary-cards" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCiaanSelect("Print Ciaan");
                    }}
                  >
                    <i className="bi bi-printer-fill"></i> Print Ciaan
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.mockExam}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "mockExam" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("mockExam")}
              >
                <i className="bi bi-clipboard2-pulse"></i>
                <span>Mock Exam</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "mockExam" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/mock-exams/create" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMockExamSelect("Create Exam");
                    }}
                  >
                    <i className="bi bi-plus-square"></i> Create Exam
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/mock-exams" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMockExamSelect("Manage");
                    }}
                  >
                    <i className="bi bi-list-check"></i> Manage Exams
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/mock-exams/results" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMockExamSelect("Results");
                    }}
                  >
                    <i className="bi bi-bar-chart-line"></i> Results
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.attendance}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "attendance" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("attendance")}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Attendance</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "attendance" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 smart-attendance-link ${location.pathname === "/smart-attendance" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAttendanceSelect("Smart Hub");
                    }}
                  >
                    <i className="bi bi-lightning-charge-fill"></i> 🎯 Smart Attendance Hub
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/mark-attendance" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAttendanceSelect("Mark Attendance");
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i> Mark Attendance
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/edit-attendance" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/view-attendance" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/attendance-summary-cards" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/defaulter" ? "active" : ""
                      }`}
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.assessment}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "assessment" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("assessment")}
              >
                <i className="bi bi-journal-check"></i>
                <span>Assessment</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "assessment" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/assess-Ciaan" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/edit-card" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/studentwise-defaulters" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAssessmentSelect("Studentwise (Defaulters)");
                    }}
                  >
                    <i className="bi bi-person-x"></i> Studentwise (Defaulters)
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/view-assessment" ? "active" : ""
                      }`}
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ct}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "ct" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("ct")}
              >
                <i className="bi bi-clipboard-check"></i>
                <span>CT</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "ct" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/ct-Ciaans" ? "active" : ""
                      }`}
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
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/ct-Ciaans" ? "active" : ""
                      }`}
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ptMicroProject}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "ptMicroProject" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("ptMicroProject")}
              >
                <i className="bi bi-diagram-3"></i>
                <span>PT & Microproject</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "ptMicroProject" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/pt-microproject/dashboard" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePtMicroProjectSelect("Dashboard");
                    }}
                  >
                    <i className="bi bi-speedometer2"></i> PT & Microproject
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/pt-microproject/microproject" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePtMicroProjectSelect("Microproject");
                    }}
                  >
                    <i className="bi bi-diagram-3"></i> Legacy Marks Entry
                  </a>
                </li>
              </ul>
            </div>
          </li>
          {/* MSBTE Formats Dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.msbte}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "msbte" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("msbte")}
              >
                <i className="bi bi-folder-fill"></i>
                <span>MSBTE Formats (K Scheme)</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "msbte" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/fa-pr-k3") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("k3");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> FA-PR-K3
                    </span>
                    <i
                      className={`bi ${openMsbteSections.k3 ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.k3 && (
                  <li>
                    <a
                      className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/fa-pr-k3/Ciaans" ? "active" : ""
                        }`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMSBTESelect("FA-PR-K3 Generate");
                      }}
                    >
                      Generate
                    </a>
                  </li>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/sa-pr-k4") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("k4");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> SA-PR-K4
                    </span>
                    <i
                      className={`bi ${openMsbteSections.k4 ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.k4 && (
                  <>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-pr-k4/Ciaans" && location.search.includes("mode=generate") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-PR-K4 Generate");
                        }}
                      >
                        Generate
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-pr-k4/Ciaans" && location.search.includes("mode=edit") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-PR-K4 Edit");
                        }}
                      >
                        Edit
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-pr-k4/Ciaans" && location.search.includes("mode=print") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-PR-K4 Print");
                        }}
                      >
                        Print
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/sa-th") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("saTh");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> SA-TH
                    </span>
                    <i
                      className={`bi ${openMsbteSections.saTh ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.saTh && (
                  <>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-th/Ciaans" && location.search.includes("mode=generate") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-TH Generate");
                        }}
                      >
                        Generate
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-th/Ciaans" && location.search.includes("mode=edit") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-TH Edit");
                        }}
                      >
                        Edit
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/sa-th/Ciaans" && location.search.includes("mode=print") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("SA-TH Print");
                        }}
                      >
                        Print
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/msbte/fa-th-k5/Ciaans" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMSBTESelect("FA-TH-K5 Generate");
                    }}
                  >
                    <i className="bi bi-file-earmark"></i> FA-TH-K5
                  </a>
                </li>
                {!isHodOrCoordinator && (
                  <li>
                    <a
                      className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/msbte/term-analysis" ? "active" : ""
                        }`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMSBTESelect("Term Analysis K7");
                      }}
                    >
                      <i className="bi bi-bar-chart-line-fill"></i> Term Analysis K7
                    </a>
                  </li>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/industrial-visit") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("k8");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> Industrial Visit (K8)
                    </span>
                    <i
                      className={`bi ${openMsbteSections.k8 ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.k8 && (
                  <>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/industrial-visit/k8/generate" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K8 Generate");
                        }}
                      >
                        Generate
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/industrial-visit/k8/edit" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K8 Edit");
                        }}
                      >
                        Edit
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/industrial-visit/k8/print" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K8 Print");
                        }}
                      >
                        Print
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/expert-lecture") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("k9");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> Expert Lecture (K9)
                    </span>
                    <i
                      className={`bi ${openMsbteSections.k9 ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.k9 && (
                  <>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/expert-lecture/k9/generate" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K9 Generate");
                        }}
                      >
                        Generate
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/expert-lecture/k9/edit" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K9 Edit");
                        }}
                      >
                        Edit
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname === "/msbte/expert-lecture/k9/print" ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMSBTESelect("K9 Print");
                        }}
                      >
                        Print
                      </a>
                    </li>
                  </>
                )}
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center justify-content-between gap-2 ${location.pathname.startsWith("/msbte/k7") ? "active-header" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMsbteSection("k7");
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark"></i> K7 (Parts A-G)
                    </span>
                    <i
                      className={`bi ${openMsbteSections.k7 ? "bi-chevron-down" : "bi-chevron-left"}`}
                    ></i>
                  </a>
                </li>
                {openMsbteSections.k7 && (
                  <>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part A") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part A");
                        }}
                      >
                        Part A
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/report-selector") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/report-selector");
                        }}
                        style={{ fontWeight: "600" }}
                      >
                        Part B
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part C") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part C");
                        }}
                      >
                        Part C
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part D") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part D");
                        }}
                      >
                        Part D
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part E") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part E");
                        }}
                      >
                        Part E
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part F") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part F");
                        }}
                      >
                        Part F
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item d-flex align-items-center gap-2 msbte-subitem ${location.pathname.includes("/msbte/k7/placeholder/Part G") ? "active" : ""
                          }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateAndClose("/msbte/k7/placeholder/Part G");
                        }}
                      >
                        Part G
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </li>
          {isHodOrCoordinator && (
            <li
              className={`sidebar-item sidebar-link-item ${isRouteActive(["/msbte/term-analysis"]) ? "active" : ""
                }`}
              onClick={() => navigateAndClose("/msbte/term-analysis")}
            >
              <i className="bi bi-bar-chart-line-fill"></i>
              <span>Term Analysis K7</span>
            </li>
          )}

          {/* Practical Exams Dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.practicalExams}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${openDropdown === "practicalExams" ? "open" : ""
                  }`}
                type="button"
                onClick={() => handleDropdownToggle("practicalExams")}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Practical Exams</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${openDropdown === "practicalExams" ? "show" : ""
                  }`}
              >
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/practical-exams" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePracticalExamSelect("Manage");
                    }}
                  >
                    <i className="bi bi-house-door"></i> Dashboard
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/practical-exams/add" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePracticalExamSelect("Add Exam");
                    }}
                  >
                    <i className="bi bi-plus-circle"></i> Add Exam
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/practical-exams/manage" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePracticalExamSelect("View/Edit");
                    }}
                  >
                    <i className="bi bi-list-check"></i> View/Edit
                  </a>
                </li>
                <li>
                  <a
                    className={`dropdown-item d-flex align-items-center gap-2 ${location.pathname === "/faculty/practical-exams/status" ? "active" : ""
                      }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePracticalExamSelect("Status Control");
                    }}
                  >
                    <i className="bi bi-eye-slash"></i> Status Control
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
