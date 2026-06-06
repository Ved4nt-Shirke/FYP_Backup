import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import "../editCiann/EditCiannModern.css";
import "./SubjectDetails.css";
import { unifiedSubjectDetailsApi } from "./api/subjectDetailsApi";

const SubjectDetails = () => {
  const location = useLocation();
  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false); // Start with false for mobile
  
  const [unifiedData, setUnifiedData] = useState(null);
  const [loadingUnified, setLoadingUnified] = useState(true);

  useEffect(() => {
    console.log("Current path:", location.pathname);
    console.log("CIAAN data in SubjectDetails:", ciannData);

    // If no ciannData from location state, try to get it from storage
    if (!ciannData) {
      // First try sessionStorage
      const storedCiannData = sessionStorage.getItem("currentCiannData");
      if (storedCiannData) {
        try {
          const parsedData = JSON.parse(storedCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored CIAAN data:", error);
        }
      }

      // Then try localStorage
      const localCiannData = localStorage.getItem("ciannData");
      if (localCiannData) {
        try {
          const parsedData = JSON.parse(localCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            // Also store in sessionStorage for consistency
            sessionStorage.setItem(
              "currentCiannData",
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
      sessionStorage.setItem("currentCiannData", JSON.stringify(ciannData));
      localStorage.setItem("ciannData", JSON.stringify(ciannData));
    }
  }, [location.pathname, ciannData]);

  // Fetch unified subject details when ciannId is set
  useEffect(() => {
    if (ciannData && ciannData.ciannId) {
      setLoadingUnified(true);
      unifiedSubjectDetailsApi.get(ciannData.ciannId)
        .then(data => {
          setUnifiedData(data);
          setLoadingUnified(false);
        })
        .catch(err => {
          console.error("Error loading unified subject details:", err);
          setLoadingUnified(false);
        });
    }
  }, [ciannData?.ciannId]);

  const updateUnifiedData = async (field, value) => {
    if (!ciannData || !ciannData.ciannId) return;
    try {
      // Optimistic update
      setUnifiedData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [field]: value
        };
      });
      // Save to backend
      await unifiedSubjectDetailsApi.save(ciannData.ciannId, { [field]: value });
    } catch (err) {
      console.error("Failed to save unified subject details:", err);
      // Reload on failure to ensure UI consistency
      const freshData = await unifiedSubjectDetailsApi.get(ciannData.ciannId);
      setUnifiedData(freshData);
    }
  };

  // Show loading state if no CIAAN data or loading unified details
  if (!ciannData || !ciannData.ciannId || loadingUnified) {
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
        <h3>Loading CIAAN Data & Subject Details...</h3>
        <p>Please wait while we load the course information.</p>
      </div>
    );
  }

  return (
    <div className="subject-details-container">
      {/* --- Left Column: Secondary Sidebar --- */}
      <div className="details-sidebar-column">
        <SecondarySidebar
          ciannData={ciannData}
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
            <Outlet context={{ unifiedData, updateUnifiedData, ciannId: ciannData.ciannId }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetails;
