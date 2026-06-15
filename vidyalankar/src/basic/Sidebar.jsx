import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ciannUtils } from "../utils/ciannUtils";
import "./Sidebar.css";

const Sidebar = ({
  isSidebarVisible,
  setIsSidebarVisible,
  ciannData,
  disableOnCompact = false,
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMsbteSections, setOpenMsbteSections] = useState({
    k3: false,
    k4: false,
    k8: false,
    k9: false,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [pendingCiannRequests, setPendingCiannRequests] = useState(0);

  const sidebarRef = useRef(null);
  const dropdownRefs = {
    ciann: useRef(null),
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
  const isFaculty = userRole === "faculty";

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
        setPendingCiannRequests(0);
        return;
      }

      try {
        const response = await ciannUtils.getIncomingShareRequests();
        setPendingCiannRequests(
          Array.isArray(response?.incoming) ? response.incoming.length : 0,
        );
      } catch (error) {
        setPendingCiannRequests(0);
      }
    };

    fetchPendingRequests();
  }, [isFaculty, location.pathname]);

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

  const handleCiannSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Create CIANN") {
      navigateAndClose("/create-ciann");
    } else if (option === "Edit CIANN") {
      navigateAndClose("/edit-ciann");
    } else if (option === "Print CIANN") {
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
    } else if (option === "Practical Batches") {
      navigateAndClose("/practical-batch-distribution");
    }
  };

  const handleAssessmentSelect = (option) => {
    setOpenDropdown(null);
    if (option === "Assess") {
      navigateAndClose("/assess-ciann");
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
      navigateAndClose("/ct-cianns");
    } else if (option === "CT2") {
      navigateAndClose("/ct-cianns");
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
      navigateAndClose("/msbte/fa-pr-k3/cianns");
    } else if (option === "FA-TH-K5 Generate") {
      navigateAndClose("/msbte/fa-th-k5/cianns");
    } else if (option === "SA-PR-K4 Generate") {
      navigateAndClose("/msbte/sa-pr-k4/cianns?mode=generate");
    } else if (option === "SA-PR-K4 Edit") {
      navigateAndClose("/msbte/sa-pr-k4/cianns?mode=edit");
    } else if (option === "SA-PR-K4 Print") {
      navigateAndClose("/msbte/sa-pr-k4/cianns?mode=print");
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
    } else {
      alert(`${action} clicked`);
    }
  };

  const sidebarClasses = `sidebar main-sidebar ${
    isSidebarVisible ? "visible" : "collapsed"
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
            className={`sidebar-item sidebar-link-item ${
              isRouteActive(["/dashboard"]) ? "active" : ""
            }`}
            onClick={() => handleItemClick("dashboard")}
          >
            <i className="bi bi-house-door"></i>
            <span>Dashboard</span>
          </li>
          <li
            className={`sidebar-item sidebar-link-item ${
              isRouteActive(["/faculty/student-timetable"]) ? "active" : ""
            }`}
            onClick={() => handleItemClick("student-timetable")}
          >
            <i className="bi bi-calendar-week"></i>
            <span>Student Timetable</span>
          </li>
          <li
            className={`sidebar-item sidebar-link-item ${
              isRouteActive(["/faculty/study-material"]) ? "active" : ""
            }`}
            onClick={() => handleItemClick("faculty-study-material")}
          >
            <i className="bi bi-journal-bookmark"></i>
            <span>Study Material</span>
          </li>
          <li className="sidebar-section-label">ACADEMIC</li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ciann}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "ciann" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("ciann")}
              >
                <i className="bi bi-file-earmark-text"></i>
                <span>CIANN</span>
                {pendingCiannRequests > 0 && (
                  <span
                    className="sidebar-notification-badge"
                    title={`${pendingCiannRequests} pending CIANN share request(s)`}
                  >
                    {pendingCiannRequests}
                  </span>
                )}
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "ciann" ? "show" : ""
                }`}
              >
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.mockExam}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "mockExam" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("mockExam")}
              >
                <i className="bi bi-clipboard2-pulse"></i>
                <span>Mock Exam</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "mockExam" ? "show" : ""
                }`}
              >
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "attendance" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("attendance")}
              >
                <i className="bi bi-check-circle-fill"></i>
                <span>Attendance</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "attendance" ? "show" : ""
                }`}
              >
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2 smart-attendance-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAttendanceSelect("Smart Hub");
                    }}
                  >
                    <i className="bi bi-lightning-charge-fill"></i> 🎯 Smart
                    Attendance Hub
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
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
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAttendanceSelect("Practical Batches");
                    }}
                  >
                    <i className="bi bi-people-fill"></i> Practical Batches
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.assessment}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "assessment" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("assessment")}
              >
                <i className="bi bi-journal-check"></i>
                <span>Assessment</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "assessment" ? "show" : ""
                }`}
              >
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
                    <i className="bi bi-person-x"></i> Studentwise (Defaulters)
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ct}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "ct" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("ct")}
              >
                <i className="bi bi-clipboard-check"></i>
                <span>CT</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "ct" ? "show" : ""
                }`}
              >
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
            </div>
          </li>
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.ptMicroProject}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "ptMicroProject" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("ptMicroProject")}
              >
                <i className="bi bi-diagram-3"></i>
                <span>PT & MICROPROJECT</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "ptMicroProject" ? "show" : ""
                }`}
              >
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "msbte" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("msbte")}
              >
                <i className="bi bi-folder-fill"></i>
                <span>MSBTE Formats (K Scheme)</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "msbte" ? "show" : ""
                }`}
              >
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center justify-content-between gap-2"
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
                      className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                    className="dropdown-item d-flex align-items-center justify-content-between gap-2"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMSBTESelect("FA-TH-K5 Generate");
                    }}
                  >
                    <i className="bi bi-file-earmark"></i> FA-TH-K5
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center justify-content-between gap-2"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                    className="dropdown-item d-flex align-items-center justify-content-between gap-2"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
                        className="dropdown-item d-flex align-items-center gap-2 msbte-subitem"
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
              </ul>
            </div>
          </li>

          {/* Practical Exams Dropdown */}
          <li className="sidebar-item">
            <div className="dropdown" ref={dropdownRefs.practicalExams}>
              <button
                className={`btn dropdown-toggle dropdown-header w-100 text-start ${
                  openDropdown === "practicalExams" ? "open" : ""
                }`}
                type="button"
                onClick={() => handleDropdownToggle("practicalExams")}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Practical Exams</span>
                <i className="bi bi-chevron-down dropdown-chevron"></i>
              </button>
              <ul
                className={`dropdown-menu sidebar-submenu ${
                  openDropdown === "practicalExams" ? "show" : ""
                }`}
              >
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
                    className="dropdown-item d-flex align-items-center gap-2"
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
