import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SecondarySidebar from "./SecondarySidebar";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../../utils/institutionBranding";
import "./EditCiannModern.css";

const CourseDiary2 = () => {
  const [isSecondarySidebarVisible, setIsSecondarySidebarVisible] =
    useState(false);

  useEffect(() => {
    const handleSecondaryToggle = () => {
      setIsSecondarySidebarVisible((prev) => !prev);
    };
    window.addEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    return () => {
      window.removeEventListener("faculty:toggle-secondary-sidebar", handleSecondaryToggle);
    };
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const [ciannData, setCiannData] = useState(location.state?.ciannData || null);
  const username = localStorage.getItem("username") || "Mr. Test User";

  const getInstitutionBranding = () => {
    const code = (
      localStorage.getItem("institutionCode") ||
      localStorage.getItem("college") ||
      "VP"
    ).toUpperCase();
    const name = localStorage.getItem("institutionName") || code;
    const logoUrl = buildInstitutionLogoUrl(
      localStorage.getItem("institutionLogoUrl") || "",
    );
    const fallback = getInstitutionInitials(name, code);
    return { code, name, logoUrl, fallback };
  };

  const [institutionBranding, setInstitutionBranding] = useState(
    getInstitutionBranding,
  );

  // Debug: Log CIANN data structure
  useEffect(() => {
    if (ciannData) {
      console.log("=== CIANN DATA STRUCTURE ===");
      console.log("ciannData:", ciannData);
      console.log("Available keys:", Object.keys(ciannData));
      console.log("==============================");
    }
  }, [ciannData]);

  // Listen for branding changes
  useEffect(() => {
    const handleStorageChange = () => {
      setInstitutionBranding(getInstitutionBranding());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Helper function to extract value from object or string
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

  // Helper function to get class and division (department scheme code e.g. CO3KA)
  const getClassAndDiv = () => {
    if (!ciannData) return "N/A";
    const deptCode = ciannData.department?.code || "";
    const sem = ciannData.semester || "";
    const scheme = ciannData.scheme || "";
    const div = ciannData.division || "";
    if (deptCode || sem || scheme || div) {
      return `${deptCode}${sem}${scheme}${div}`.toUpperCase();
    }
    return "N/A";
  };

  // Helper function to get subject and code
  const getSubjectAndCode = () => {
    if (!ciannData) return "N/A";
    const name = ciannData.subject?.name || extractValue(ciannData, "subjectName", "subject");
    const code = ciannData.subject?.code || extractValue(ciannData, "subjectCode", "code");
    if (name && code) return `${name} (${code})`;
    return name || "N/A";
  };

  // Helper function to get department
  const getDepartment = () => {
    if (!ciannData) return "N/A";

    // Try all possible department field names and structures
    const possibleFields = [
      "department",
      "dept",
      "departmentName",
      "Department",
      "DEPARTMENT",
      "branch",
      "Branch",
      "stream",
      "Stream",
      "course",
      "Course",
    ];

    for (const field of possibleFields) {
      const value = ciannData[field];
      if (value) {
        if (typeof value === "object") {
          if (value.name) return value.name;
          if (value.departmentName) return value.departmentName;
          if (value.department) return value.department;
          if (value.value) return value.value;
        } else if (typeof value === "string" && value.trim() !== "") {
          return value;
        }
      }
    }

    // Check nested structures
    const nestedPaths = [
      ciannData?.academicInfo?.department,
      ciannData?.courseDetails?.department,
      ciannData?.details?.department,
      ciannData?.info?.department,
      ciannData?.subjectDetails?.department,
      ciannData?.class?.department,
      ciannData?.subject?.department,
    ];

    for (const path of nestedPaths) {
      if (path) {
        if (typeof path === "object" && path.name) return path.name;
        if (typeof path === "string" && path.trim() !== "") return path;
      }
    }

    console.log(
      "Department not found. Available fields:",
      Object.keys(ciannData),
    );
    return "N/A";
  };

  // This hook handles mobile responsiveness for our styles
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // CIANN data management
  useEffect(() => {
    if (!ciannData) {
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
      const localCiannData = localStorage.getItem("ciannData");
      if (localCiannData) {
        try {
          const parsedData = JSON.parse(localCiannData);
          if (parsedData && parsedData.ciannId) {
            setCiannData(parsedData);
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
      sessionStorage.setItem("currentCiannData", JSON.stringify(ciannData));
      localStorage.setItem("ciannData", JSON.stringify(ciannData));
    }
  }, [ciannData]);

  const handleForward = () => {
    navigate("/timetable", { state: { ciannData } });
  };

  const formatUsername = (rawUsername) => {
    if (!rawUsername) return "";
    const localUser = localStorage.getItem("username");
    const facultyName = localStorage.getItem("facultyName");
    if (localUser && rawUsername && localUser.trim().toLowerCase() === rawUsername.trim().toLowerCase() && facultyName) {
      return facultyName;
    }
    if (rawUsername.includes(".")) {
      return rawUsername
        .split(".")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
    return rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1);
  };

  const getTeacherNames = () => {
    if (!ciannData) return formatUsername(username);

    const primaryOwner = formatUsername(ciannData.ownerUsername || ciannData.owner?.username || ciannData.owner || "N/A");
    const coFaculty = [];
    const contributors = [];

    if (Array.isArray(ciannData.sharedWith)) {
      ciannData.sharedWith.forEach((share) => {
        const name = share.user?.username || share.username || (typeof share.user === 'string' ? share.user : null);
        if (name) {
          const formatted = formatUsername(name);
          if (share.permission === "edit") {
            coFaculty.push(formatted);
          } else {
            contributors.push(formatted);
          }
        }
      });
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div>
          <strong>{primaryOwner}</strong> <span style={{ fontSize: "0.8rem", color: "#22c55e", marginLeft: "6px" }}>(Primary Owner)</span>
        </div>
        {coFaculty.map((name, i) => (
          <div key={`co-${i}`} style={{ fontSize: "0.9rem" }}>
            {name} <span style={{ fontSize: "0.75rem", color: "#3b82f6", marginLeft: "6px" }}>(Co-Faculty)</span>
          </div>
        ))}
        {contributors.map((name, i) => (
          <div key={`cont-${i}`} style={{ fontSize: "0.9rem" }}>
            {name} <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "6px" }}>(Contributor)</span>
          </div>
        ))}
      </div>
    );
  };

  // --- All CSS Styles are now defined here as JavaScript objects ---

  const styles = {
    layout: {
      display: "flex",
      flexDirection: "column",
      minHeight: "100%",
      backgroundColor: "#f8f9fa",
      overflow: "visible",
    },
    mainRow: { display: "flex", flex: 1, overflow: "visible" },
    mainContent: {
      flex: 1,
      padding: isMobile ? "16px" : "24px",
      overflowY: "visible",
      marginLeft: isMobile ? "0" : "310px",
    },
    container: {
      width: "100%",
      maxWidth: "900px",
      margin: "0 auto",
      background: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      padding: isMobile ? "16px" : "30px",
      boxSizing: "border-box",
    },
    headerWrapper: {
      display: "flex",
      alignItems: "center",
      marginBottom: "30px",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "15px" : "20px",
    },
    logo: { height: isMobile ? "50px" : "60px", objectFit: "contain" },
    logoFallback: {
      width: isMobile ? "70px" : "84px",
      height: isMobile ? "50px" : "60px",
      borderRadius: "8px",
      backgroundColor: "#e5e7eb",
      color: "#111827",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "700",
      fontSize: isMobile ? "16px" : "20px",
      textTransform: "uppercase",
    },
    header: {
      flexGrow: 1,
      backgroundColor: "var(--app-header-bg)",
      color: "#fff", // Use CSS variable for theme
      textAlign: "center",
      padding: "15px 20px",
      borderRadius: "6px",
    },
    title: {
      fontSize: isMobile ? "1.2rem" : "24px",
      fontWeight: "bold",
      margin: 0,
    },
    centerBlock: { textAlign: "center", marginBottom: "30px" },
    ciannLabel: {
      color: "var(--app-header-bg)",
      fontSize: "28px",
      margin: "0 0 10px",
    }, // Use CSS variable
    ciannSubtitleP: { margin: "5px 0" },
    infoBlock: {
      display: isMobile ? "block" : "table",
      width: "100%",
      maxWidth: "750px",
      margin: isMobile ? "40px auto" : "75px auto 40px auto",
      borderCollapse: "separate",
      borderSpacing: "0 8px",
    },
    infoRow: {
      display: isMobile ? "flex" : "table-row",
      flexDirection: "column",
      marginBottom: isMobile ? "10px" : "0",
      border: isMobile ? "1px solid #ddd" : "none",
      borderRadius: isMobile ? "4px" : "0",
      overflow: isMobile ? "hidden" : "visible",
    },
    infoLabel: {
      backgroundColor: "var(--app-header-bg)",
      color: "white",
      fontWeight: "bold", // Use CSS variable
      width: isMobile ? "100%" : "35%",
      display: isMobile ? "block" : "table-cell",
      padding: "12px 15px",
      verticalAlign: "middle",
      boxSizing: "border-box",
    },
    infoValue: {
      width: isMobile ? "100%" : "65%",
      backgroundColor: isMobile ? "#f8f9fa" : "#fff",
      border: isMobile ? "none" : "1px solid #ddd",
      borderTop: isMobile ? "1px solid #ddd" : "1px solid #ddd",
      display: isMobile ? "block" : "table-cell",
      padding: "12px 15px",
      verticalAlign: "middle",
      boxSizing: "border-box",
    },
    forwardWrapper: {
      display: "flex",
      justifyContent: isMobile ? "center" : "flex-end",
      marginTop: "20px",
    },
    forwardButton: {
      backgroundColor: "var(--app-header-bg)",
      color: "white",
      border: "none", // Use CSS variable
      padding: "10px 20px",
      borderRadius: "6px",
      fontSize: "16px",
      cursor: "pointer",
    },
    instituteInfo: {
      textAlign: "center",
      marginBottom: "20px",
      fontSize: "14px",
      color: "var(--app-header-bg)",
      fontWeight: "500", // Use CSS variable
    },
  };

  return (
    <div className="ciann-diary-root" style={styles.layout}>
      <SecondarySidebar
        isSecondarySidebarVisible={isSecondarySidebarVisible}
        setIsSecondarySidebarVisible={setIsSecondarySidebarVisible}
      />
      <div style={styles.mainRow}>
        <main className="ciann-diary-main" style={styles.mainContent}>
          <div className="ciann-diary-surface" style={styles.container}>
            <header style={styles.headerWrapper}>
              <div style={{ flexShrink: 0 }}>
                {institutionBranding.logoUrl ? (
                  <img
                    src={institutionBranding.logoUrl}
                    alt={`${institutionBranding.name} Logo`}
                    style={styles.logo}
                  />
                ) : (
                  <div style={styles.logoFallback}>
                    {institutionBranding.fallback}
                  </div>
                )}
              </div>
              <div style={styles.header}>
                <h2 style={styles.title}>COURSE DIARY</h2>
              </div>
            </header>
            <div style={styles.instituteInfo}>
              <p>{institutionBranding.name}</p>
            </div>
            <div style={styles.centerBlock}>
              <h3 style={styles.ciannLabel}>CIAAN</h3>
              <div>
                <p style={styles.ciannSubtitleP}>
                  Curriculum Implementation and Assessment Norms
                </p>
                <p style={styles.ciannSubtitleP}>
                  <strong>Academic Year:</strong> 2023 - 2024
                </p>
                <p style={styles.ciannSubtitleP}>
                  <strong>INST. CODE:</strong> 0568
                </p>
              </div>
            </div>
            <div style={styles.infoBlock}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Name of Subject Teacher</span>
                <span style={styles.infoValue}>{getTeacherNames()}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Class & Div.</span>
                <span style={styles.infoValue}>{getClassAndDiv()}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Subject & Subject Code</span>
                <span style={styles.infoValue}>{getSubjectAndCode()}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Department</span>
                <span style={styles.infoValue}>{getDepartment()}</span>
              </div>
            </div>
            <div style={styles.forwardWrapper}>
              <button style={styles.forwardButton} onClick={handleForward}>
                <span>➔</span> Forward
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseDiary2;
