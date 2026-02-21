import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import CiannSelector from "../components/CiannSelector";
import "./Sidebar1.css";

const SecondarySidebar = ({
  ciannData,
  isSecondarySidebarVisible = true,
  setIsSecondarySidebarVisible,
}) => {
  const navigate = useNavigate();
  const [showCiannSelector, setShowCiannSelector] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
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
      "Teaching Plan (TP)": "/teaching-plan",
      "Laboratory Plan (LP)": "/laboratory-plan",
      "Students List": "/student-list",
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

  if (isMobile && !isSecondarySidebarVisible) {
    return (
      <>
        {showCiannSelector && (
          <CiannSelector
            onSelect={handleCiannSelect}
            onCancel={handleCiannCancel}
          />
        )}
      </>
    );
  }

  const sidebarContent = (
    <>
      <div
        className={`secondary-sidebar-wrapper ${
          isMobile && isSecondarySidebarVisible ? "visible" : ""
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setIsSecondarySidebarVisible(false);
          }
        }}
      >
        <div className={sidebarClasses}>
          <div className="secondary-sidebar-header">
            CIAAN
            {isMobile && (
              <button
                className="secondary-sidebar-close-btn"
                onClick={() => setIsSecondarySidebarVisible(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          <ul>
            {[
              "Front Page",
              "Time Table & Load",
              "Students List",
              "Teaching Plan (TP)",
              "Laboratory Plan (LP)",
            ].map((item, index) => (
              <li key={index} onClick={() => handleClick(item)}>
                {index + 1}. {item}
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
