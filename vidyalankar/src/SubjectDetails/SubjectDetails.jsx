import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SecondarySidebar from "../editCiann/SecondarySidebar";
import Header from "../basic/Header";

const SubjectDetails = () => {
  const location = useLocation();
  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] = useState(false); // Start with false for mobile

  useEffect(() => {
    console.log("Current path:", location.pathname);
    console.log("CIAAN data in SubjectDetails:", ciannData);
    
    // If no ciannData from location state, try to get it from storage
    if (!ciannData) {
      // First try sessionStorage
      const storedCiannData = sessionStorage.getItem('currentCiannData');
      if (storedCiannData) {
        try {
          const parsedData = JSON.parse(storedCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            return;
          }
        } catch (error) {
          console.error('Error parsing stored CIAAN data:', error);
        }
      }
      
      // Then try localStorage
      const localCiannData = localStorage.getItem('ciannData');
      if (localCiannData) {
        try {
          const parsedData = JSON.parse(localCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
            // Also store in sessionStorage for consistency
            sessionStorage.setItem('currentCiannData', JSON.stringify(parsedData));
            return;
          }
        } catch (error) {
          console.error('Error parsing local CIAAN data:', error);
        }
      }
    } else {
      // Store CIAAN data in sessionStorage for persistence across navigation
      sessionStorage.setItem('currentCiannData', JSON.stringify(ciannData));
      localStorage.setItem('ciannData', JSON.stringify(ciannData));
    }
  }, [location.pathname, ciannData]);

  // Show loading state if no CIAAN data
  if (!ciannData || !ciannData.ciannId) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh"
      }}>
        <h3>Loading CIAAN Data...</h3>
        <p>Please wait while we load the CIAAN information.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header with secondary sidebar toggle like editCiann pages */}
      <Header 
        onMenuToggle={() =>
          window.dispatchEvent(new CustomEvent("faculty:toggle-main-sidebar"))
        }
        onSecondaryMenuToggle={() => setIsSecondarySidebarVisible(v => !v)}
      />

      <div className="subject-details-container">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
          
          /* Reset any potential conflicts for SubjectDetails */
          .subject-details-container * {
            box-sizing: border-box;
          }
          
          /* Override any inherited main styles */
          .subject-details-container main {
            padding: 0;
            background-color: transparent;
            margin: 0;
            flex: none;
          }

          /* Main container that accounts for the main sidebar */
          .subject-details-container {
            display: flex;
            width: 100%;
            font-family: 'Poppins', sans-serif;
            min-height: calc(100vh - var(--header-height, 60px));
            background-color: #f8f9fa;
            margin: 0;
            padding: 1rem;
            gap: 1rem;
            box-sizing: border-box;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
            margin-top: var(--header-height, 60px);
          }

          /* Left column for the secondary sidebar */
          .details-sidebar-column {
            width: 220px;
            min-width: 220px;
            max-width: 220px;
            flex-shrink: 0;
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 0;
            height: fit-content;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            position: sticky;
            top: calc(var(--header-height, 60px) + 1rem);
            z-index: 1;
          }

          /* Right column for the main content */
          .details-content-column {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 0; /* Removed problematic padding */
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            overflow: hidden;
            min-height: 600px;
            position: relative; /* Keep relative for internal positioning */
            z-index: 2;
            margin-right: 0; /* Removed extraneous margin */
          }

          /* Wrapper for the navbar */
          .navbar-wrapper {
            margin-top: 0;
            background-color: #ffffff;
            border-bottom: 2px solid #f1f3f4;
            padding: 1.5rem 2rem 0 2rem;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          /* Wrapper for the main page content from the Outlet */
          .page-content {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            overflow-x: hidden;
            margin-left: 0; /* Removed margin-left */
            background-color: #ffffff;
            min-width: 0;
          }
          
          /* Ensure tables and content fit properly */
          .page-content table {
            max-width: 100%;
            overflow-x: auto;
          }
          
          .page-content .table-wrapper {
            overflow-x: auto;
            max-width: 100%;
          }
          
          /* Ensure content doesn't get cut off */
          .page-content * {
            max-width: 100%;
            word-wrap: break-word;
          }

          /* Responsive adjustments */
          @media (max-width: 1200px) {
            .subject-details-container {
              padding: 1rem;
              gap: 0.75rem;
            }
            
            .details-sidebar-column {
              width: 210px;
              min-width: 210px;
              max-width: 210px;
            }
            
            .details-content-column { min-width: 0; }
            
            .navbar-wrapper {
              padding: 1.5rem 1.5rem 0 1.5rem;
            }
            
            .page-content {
              padding: 1.5rem;
            }
          }
          
          @media (max-width: 1024px) {
            .subject-details-container {
              padding: 0.75rem;
              gap: 0.5rem;
            }
            
            .details-sidebar-column {
              width: 200px;
              min-width: 200px;
              max-width: 200px;
            }
            
            .details-content-column { min-width: 0; }
            
            .navbar-wrapper {
              padding: 1rem 1.25rem 0 1.25rem;
            }
            
            .page-content {
              padding: 1.25rem;
            }
          }
          
          @media (max-width: 768px) {
            .subject-details-container {
              flex-direction: column;
              padding: 0.5rem;
              gap: 0.5rem;
              width: 100%;
              position: relative;
              min-height: auto;
              margin-top: var(--header-height, 50px);
            }
            
            .details-sidebar-column {
              width: 100%;
              min-width: unset;
              max-width: unset;
              height: auto;
              position: static;
              top: auto;
            }
            
            .details-content-column {
              min-width: unset;
              min-height: 500px;
              position: static;
            }
            
            .navbar-wrapper {
              padding: 1rem;
            }
            
            .page-content {
              padding: 1rem;
            }
          }
        `}</style>

        {/* --- Left Column: Secondary Sidebar --- */}
        <div className="details-sidebar-column">
          <SecondarySidebar 
            ciannData={ciannData || (() => {
              const stored = sessionStorage.getItem('currentCiannData');
              return stored ? JSON.parse(stored) : null;
            })()} 
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
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubjectDetails;
  
