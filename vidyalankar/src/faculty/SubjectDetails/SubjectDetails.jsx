import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import "../editCiann/EditCiannModern.css";
import "./SubjectDetails.css";

const SubjectDetails = () => {
  const location = useLocation();
  const [CiaanData, setCiaanData] = useState(location.state?.CiaanData || null);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false); // Start with false for mobile

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  useEffect(() => {
    console.log("Current path:", location.pathname);
    console.log("CIAAN data in SubjectDetails:", CiaanData);

    // If no CiaanData from location state, try to get it from storage
    if (!CiaanData) {
      // First try sessionStorage
      const storedCiaanData = sessionStorage.getItem("currentCiaanData");
      if (storedCiaanData) {
        try {
          const parsedData = JSON.parse(storedCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }

      // Then try localStorage
      const localCiaanData = localStorage.getItem("CiaanData");
      if (localCiaanData) {
        try {
          const parsedData = JSON.parse(localCiaanData);
          if (parsedData && parsedData.CiaanId) {
            setCiaanData(parsedData);
            // Also store in sessionStorage for consistency
            sessionStorage.setItem(
              "currentCiaanData",
              JSON.stringify(parsedData),
            );
            return;
          }
        } catch (error) {
          console.error("Error parsing local CIAAN data:", error);
        }
      }
    } else {
      // Store CIAAN data in sessionStorage for persistence across navigation
      sessionStorage.setItem("currentCiaanData", JSON.stringify(CiaanData));
      localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    }
  }, [location.pathname, CiaanData]);

  // Show loading state if no CIAAN data
  if (!CiaanData || !CiaanData.CiaanId) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <h3>Loading CIAAN Data...</h3>
        <p>Please wait while we load the CIAAN information.</p>
      </div>
    );
  }

  return (
    <div className="subject-details-container">
      {/* --- Left Column: Secondary Sidebar --- */}
      <div className="details-sidebar-column">
        <SecondarySidebar
          CiaanData={
            CiaanData ||
            (() => {
              const stored = sessionStorage.getItem("currentCiaanData");
              return stored ? JSON.parse(stored) : null;
            })()
          }
          isSecondarySidebarVisible={isSecondarySidebarVisible}
          setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
        />
      </div>

      {/* --- Right Column: Navbar and Content --- */}
      <div className="details-content-column">
        <div className="navbar-wrapper">
          <Navbar />
        </div>
        <div className="page-content">
          <main className="subject-details-main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetails;
