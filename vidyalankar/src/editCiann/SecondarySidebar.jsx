import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import CiannSelector from "../components/CiannSelector";
import "./Sidebar1.css";

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

  const toggleSubMenu = (label) => {
    setOpenSubMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems = [
    { label: "Front Page", path: "/course-diary", icon: "bi-journal-text" },
    {
      label: "Course",
      icon: "bi-book",
      subItems: [
        { label: "Manage Chapters", path: "/chapters" },
        { label: "Manage Practical", path: "/experiment" },
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
      "Manage Chapters": "/chapters",
      "Manage Practical": "/experiment",
    };
    const route = routes[label];
    if (!route) {
      alert(`You clicked: ${label}`);
      return;
    }

    if (currentCiannData && currentCiannData.ciannId) {
      navigate(route, { state: { ciannData: currentCiannData } });
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
      navigate(pendingNavigation.route, {
        state: { ciannData: selectedCiann },
      });
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

  const sidebarClasses = `secondary-sidebar ${
    isMobile ? (isSecondarySidebarVisible ? "visible" : "") : "visible"
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
        className={`secondary-sidebar-wrapper ciann-secondary-sidebar-wrapper ${
          isMobile && isSecondarySidebarVisible ? "visible" : ""
        }`}
      >
        <div className={sidebarClasses}>
          <div className="secondary-sidebar-header">
            <div className="secondary-sidebar-title-wrap">
              <span className="secondary-sidebar-eyebrow">CIANN Workspace</span>
              <span className="secondary-sidebar-title">CIAAN</span>
            </div>
            {isMobile && (
              <button
                className="secondary-sidebar-close-btn"
                onClick={() => setIsSecondarySidebarVisible(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          <ul className="secondary-nav-list">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <li
                  className={`secondary-nav-item ${
                    !item.subItems &&
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
                      className={`bi ${
                        openSubMenus[item.label] ? "bi-chevron-down" : "bi-chevron-right"
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
                        className={`secondary-nav-subitem ${
                          location.pathname === subItem.path ||
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
    </>
  );
};

export default SecondarySidebar;
