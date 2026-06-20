import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import CiannSelector from "../components/CiannSelector";
import CiannCommentsSection from "../components/CiannCommentsSection";
import { ciannUtils } from "../../utils/ciannUtils";
import "./Sidebar1.css";

const extractValue = (data, ...possibleKeys) => {
  if (!data) return null;
  for (const key of possibleKeys) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "object" && value.name) {
        return value.name;
      } else if (typeof value === "object" && value.code) {
        return value.code;
      } else if (typeof value === "string") {
        return value;
      }
    }
  }
  return null;
};

const getCiannParams = (data) => {
  if (!data) return { program: "N/A", className: "N/A", course: "N/A" };

  // 1. Get program/department name
  let program = extractValue(data, "department", "dept", "departmentName", "Department", "DEPARTMENT", "branch", "Branch", "stream", "Stream") || "N/A";
  if (program === "N/A" || typeof program !== "string") {
    const nestedDept = data?.academicInfo?.department || data?.courseDetails?.department || data?.details?.department || data?.info?.department || data?.subjectDetails?.department || data?.class?.department || data?.subject?.department;
    if (nestedDept) {
      if (typeof nestedDept === "object" && nestedDept.name) program = nestedDept.name;
      else if (typeof nestedDept === "string") program = nestedDept;
    }
  }
  if (typeof program === "object" && program !== null) {
    program = program.name || program.label || "N/A";
  }

  // 2. Get class name
  let className = extractValue(data, "className", "class", "classname", "Class", "ClassName", "semester", "year") || "N/A";
  if (className === "N/A") {
    className = data?.classDetails?.className || data?.class?.name || data?.class || data?.academicInfo?.class || "N/A";
  }
  if (typeof className === "object" && className !== null) {
    className = className.name || className.label || "N/A";
  }

  // 3. Get course (subject name)
  let course = extractValue(data, "subjectName", "subject", "subjectname", "Subject", "SubjectName", "title", "courseName", "name") || "N/A";
  if (course === "N/A") {
    course = data?.subjectDetails?.name || data?.subject?.name || data?.subject || data?.courseInfo?.subject || "N/A";
  }
  if (typeof course === "object" && course !== null) {
    course = course.name || course.label || "N/A";
  }

  return { program, className, course };
};

const SecondarySidebar = ({
  ciannData,
  isSecondarySidebarVisible = true,
  setIsSecondarySidebarVisible,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCiannSelector, setShowCiannSelector] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});

  // Collaboration and notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const notifDropdownRef = useRef(null);

  const toggleSubMenu = (label) => {
    setOpenSubMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [
    { label: "Front Page", path: "/course-diary", icon: "bi-journal-text" },
    {
      label: "Course",
      icon: "bi-book",
      subItems: [
        { label: "Manage Chapters", path: "/add-chapters" },
        { label: "Manage Practical", path: "/course2" },
      ],
    },
    {
      label: "Time Table & Load",
      path: "/timetable",
      icon: "bi-calendar3-week",
    },
    {
      label: "Syllabus Contents",
      path: "/syllabus",
      icon: "bi-card-list",
    },
    {
      label: "Subject Details",
      path: "/subject-details",
      icon: "bi-book",
    },
    {
      label: "TLO Details",
      path: "/tlo",
      icon: "bi-journal-text",
    },
    {
      label: "LLO Details",
      path: "/llo",
      icon: "bi-flask",
    },
    { label: "Students List", path: "/student-list", icon: "bi-people" },
    {
      label: "Teaching Plan (TP)",
      path: "/teaching-plan",
      icon: "bi-clipboard-data",
    },
    {
      label: "Laboratory Plan (LP)",
      path: "/laboratory-plan",
      icon: "bi-beaker",
    },
    {
      label: "Tutorial Planning",
      path: "/tutorial-plan",
      icon: "bi-book-half",
    },
  ];

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getCiannData = () => {
    if (ciannData && ciannData.ciannId) {
      return ciannData;
    }
    const storedCiannData = sessionStorage.getItem("currentCiannData");
    if (storedCiannData) {
      try {
        const parsedData = JSON.parse(storedCiannData);
        if (parsedData && parsedData.ciannId) {
          return parsedData;
        }
      } catch (error) {
        console.error("Error parsing stored CIAAN data:", error);
      }
    }
    const localCiannData = localStorage.getItem("ciannData");
    if (localCiannData) {
      try {
        const parsedData = JSON.parse(localCiannData);
        if (parsedData && parsedData.ciannId) {
          return parsedData;
        }
      } catch (error) {
        console.error("Error parsing local CIAAN data:", error);
      }
    }
    return null;
  };

  const currentCiann = getCiannData();
  const isReadOnly = currentCiann?.accessLevel === "read";

  // Enforce read-only state by styling & class names
  useEffect(() => {
    if (isReadOnly) {
      document.body.classList.add("ciann-view-only");
    } else {
      document.body.classList.remove("ciann-view-only");
    }
    return () => {
      document.body.classList.remove("ciann-view-only");
    };
  }, [ciannData, location.pathname, isReadOnly]);

  // Notifications fetching logic
  const fetchNotifications = async () => {
    try {
      const data = await ciannUtils.fetchNotifications();
      const list = data?.notifications || [];
      setNotifications(list);
      setUnreadNotifCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside for notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await ciannUtils.markNotificationRead(notif._id);
        fetchNotifications();
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    setShowNotifDropdown(false);
    if (notif.ciannId) {
      try {
        const ciann = await ciannUtils.fetchCiannById(notif.ciannId);
        if (ciann) {
          sessionStorage.setItem("currentCiannData", JSON.stringify(ciann));
          localStorage.setItem("ciannData", JSON.stringify(ciann));
          window.location.reload();
        }
      } catch (err) {
        console.error("Failed to fetch notification's ciann:", err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ciannUtils.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleClick = (label) => {
    const currentCiannData = getCiannData();
    const routes = {
      "Front Page": "/course-diary",
      "Time Table & Load": "/timetable",
      "Syllabus Contents": "/syllabus",
      "Teaching Plan (TP)": "/teaching-plan",
      "Laboratory Plan (LP)": "/laboratory-plan",
      "Tutorial Planning": "/tutorial-plan",
      "Tutorial Plan (TUT)": "/tutorial-plan",
      "Students List": "/student-list",
      "Subject Details": "/subject-details",
      "TLO Details": "/tlo",
      "LLO Details": "/llo",
      "Manage Chapters": "/add-chapters",
      "Manage Practical": "/course2",
    };
    const route = routes[label];
    if (!route) {
      alert(`You clicked: ${label}`);
      return;
    }

    if (currentCiannData && currentCiannData.ciannId) {
      if (label === "Manage Chapters") {
        const params = getCiannParams(currentCiannData);
        navigate(route, {
          state: {
            program: params.program,
            className: params.className,
            course: params.course,
            ciannData: currentCiannData,
          },
        });
      } else if (label === "Manage Practical") {
        const params = getCiannParams(currentCiannData);
        const searchParams = new URLSearchParams({
          program: params.program,
          className: params.className,
          course: params.course,
        }).toString();
        navigate(`${route}?${searchParams}`, {
          state: { ciannData: currentCiannData },
        });
      } else {
        navigate(route, { state: { ciannData: currentCiannData } });
      }
      // ✅ FIX: Close sidebar after navigation
      if (isMobile) {
        setIsSecondarySidebarVisible(false);
      }
      return;
    }

    setPendingNavigation({ route, label });
    setShowCiannSelector(true);
  };

  const handleCiannSelect = (selectedCiann) => {
    sessionStorage.setItem("currentCiannData", JSON.stringify(selectedCiann));
    localStorage.setItem("ciannData", JSON.stringify(selectedCiann));
    if (pendingNavigation) {
      const { route, label } = pendingNavigation;
      if (label === "Manage Chapters") {
        const params = getCiannParams(selectedCiann);
        navigate(route, {
          state: {
            program: params.program,
            className: params.className,
            course: params.course,
            ciannData: selectedCiann,
          },
        });
      } else if (label === "Manage Practical") {
        const params = getCiannParams(selectedCiann);
        const searchParams = new URLSearchParams({
          program: params.program,
          className: params.className,
          course: params.course,
        }).toString();
        navigate(`${route}?${searchParams}`, {
          state: { ciannData: selectedCiann },
        });
      } else {
        navigate(route, {
          state: { ciannData: selectedCiann },
        });
      }
    }
    setShowCiannSelector(false);
    setPendingNavigation(null);
    // ✅ FIX: Close sidebar after Ciann selection
    if (isMobile) {
      setIsSecondarySidebarVisible(false);
    }
  };

  const handleCiannCancel = () => {
    setShowCiannSelector(false);
    setPendingNavigation(null);
  };

  const sidebarClasses = `secondary-sidebar ${isMobile ? (isSecondarySidebarVisible ? "visible" : "") : "visible"
    } ${isMobile ? "mobile" : ""}`;

  const sidebarContent = (
    <>
      {isMobile && isSecondarySidebarVisible && (
        <div
          className="secondary-sidebar-overlay"
          onClick={() => setIsSecondarySidebarVisible(false)}
        ></div>
      )}
      <div
        className={`secondary-sidebar-wrapper ciann-secondary-sidebar-wrapper ${isMobile && isSecondarySidebarVisible ? "visible" : ""
          }`}
      >
        <div className={sidebarClasses}>
          <div className="secondary-sidebar-header">
            <div className="secondary-sidebar-title-wrap">
              <span className="secondary-sidebar-eyebrow">CIANN Workspace</span>
              <span className="secondary-sidebar-title">CIAAN</span>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="d-flex align-items-center">
              <div className="ciann-notif-container" ref={notifDropdownRef}>
                <button
                  type="button"
                  className="ciann-notif-bell-btn"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  title="Notifications"
                >
                  <i className="bi bi-bell-fill"></i>
                  {unreadNotifCount > 0 && (
                    <span className="ciann-notif-badge">{unreadNotifCount}</span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="ciann-notif-dropdown">
                    <div className="ciann-notif-header">
                      <span className="ciann-notif-title">Notifications</span>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          className="ciann-notif-markall-btn"
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="ciann-notif-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <li
                            key={notif._id}
                            className={`ciann-notif-item ${notif.isRead ? "" : "unread"}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <span className="ciann-notif-message">{notif.message}</span>
                            <span className="ciann-notif-time">
                              {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="ciann-notif-empty">No notifications yet.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {isMobile && (
                <button
                  className="secondary-sidebar-close-btn ms-2"
                  onClick={() => setIsSecondarySidebarVisible(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
          <ul className="secondary-nav-list">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <li
                  className={`secondary-nav-item ${!item.subItems &&
                      (location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`))
                      ? "active"
                      : ""
                    }`}
                  onClick={() => {
                    if (item.subItems) {
                      toggleSubMenu(item.label);
                    } else {
                      handleClick(item.label);
                    }
                  }}
                  style={item.subItems ? { cursor: "pointer" } : {}}
                >
                  <span className="secondary-nav-index">{index + 1}</span>
                  <i className={`bi ${item.icon} secondary-nav-icon`}></i>
                  <span className="secondary-nav-label">{item.label}</span>
                  {item.subItems && (
                    <i
                      className={`bi ${openSubMenus[item.label] ? "bi-chevron-down" : "bi-chevron-right"
                        } ms-auto`}
                      style={{ fontSize: "0.8rem", color: "#64748b" }}
                    ></i>
                  )}
                </li>
                {item.subItems && openSubMenus[item.label] && (
                  <ul
                    className="secondary-nav-sublist"
                    style={{ listStyle: "none", paddingLeft: "45px", margin: "5px 0 10px 0" }}
                  >
                    {item.subItems.map((subItem) => (
                      <li
                        key={subItem.label}
                        className={`secondary-nav-subitem ${location.pathname === subItem.path ||
                            location.pathname.startsWith(`${subItem.path}/`)
                            ? "active"
                            : ""
                          }`}
                        onClick={() => handleClick(subItem.label)}
                        style={{
                          padding: "8px 0",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color:
                            location.pathname === subItem.path ||
                              location.pathname.startsWith(`${subItem.path}/`)
                              ? "#4f46e5"
                              : "#475569",
                          fontWeight:
                            location.pathname === subItem.path ||
                              location.pathname.startsWith(`${subItem.path}/`)
                              ? "600"
                              : "500",
                          fontSize: "0.9rem",
                        }}
                      >
                        <i className="bi bi-dot"></i>
                        <span>{subItem.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isMobile ? createPortal(sidebarContent, document.body) : sidebarContent}

      {showCiannSelector && (
        <CiannSelector
          onSelect={handleCiannSelect}
          onCancel={handleCiannCancel}
        />
      )}

      {/* View-Only Banner */}
      {isReadOnly && createPortal(
        <div className="ciann-view-only-banner" style={{ zIndex: 999999, position: "fixed", top: 0, left: 0, right: 0, height: "38px", boxSizing: "border-box" }}>
          <i className="bi bi-lock-fill me-2"></i>
          <strong>View-Only Access Mode:</strong> You have read-only access to this CIANN. Editing is disabled.
        </div>,
        document.body
      )}

      {/* Floating Comments Section */}
      {currentCiann?.ciannId && (
        <>
          <button
            type="button"
            className="ciann-comments-toggle-btn"
            onClick={() => setShowComments(true)}
          >
            <i className="bi bi-chat-left-text-fill"></i>
            <span>Discussion</span>
          </button>

          <CiannCommentsSection
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            ciannId={currentCiann.ciannId}
          />
        </>
      )}
    </>
  );
};

export default SecondarySidebar;
