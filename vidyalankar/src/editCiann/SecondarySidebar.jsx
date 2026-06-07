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

  const menuItems = [
    { label: "Front Page", path: "/course-diary", icon: "bi-journal-text" },
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
              <li
                key={item.label}
                className={`secondary-nav-item ${
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`)
                    ? "active"
                    : ""
                }`}
                onClick={() => handleClick(item.label)}
              >
                <span className="secondary-nav-index">{index + 1}</span>
                <i className={`bi ${item.icon} secondary-nav-icon`}></i>
                <span className="secondary-nav-label">{item.label}</span>
              </li>
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
