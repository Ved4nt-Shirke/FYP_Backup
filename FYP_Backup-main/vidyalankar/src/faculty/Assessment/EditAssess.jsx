// src/Assessment/EditAssess.jsx
import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import "./assess/AssessCiaan.css"; // Using the same CSS as new assessment

const EditAssess = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active academic year first
        const yearRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/academic-year/current`);
        const yearData = await yearRes.json();
        if (yearData.success) {
          setActiveAcademicYear(yearData.academicYear);
        }

        const ciannRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/cianns`);
        const ciannData = await ciannRes.json();
        setCiannDataList(ciannData);

        const batchesRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches`);
        const batchesData = await batchesRes.json();
        if (batchesData.success) {
          setAvailableBatches(batchesData.batches);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = async (ciannData) => {
    setLoadingExperiments(true);
    try {
      const experimentsRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/get-experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: ciannData.department?.name || "",
          className: ciannData.courseCode || ciannData.class || "",
          course: ciannData.subject?.name || "",
        }),
      });
      const experimentsData = await experimentsRes.json();
      navigate("/edit-batch-select", {
        state: {
          ciannData,
          experiments: experimentsData.success ? experimentsData.experiments || [] : [],
          availableBatches: availableBatches,
        },
      });
    } catch (error) {
      console.error("Error fetching experiments:", error);
      navigate("/edit-batch-select", {
        state: { ciannData, experiments: [], availableBatches },
      });
    } finally {
      setLoadingExperiments(false);
    }
  };

  // Filter CIANNs: active ones are those in active academic year and not completed/archived
  const activeCianns = ciannDataList.filter(c => 
    c.status !== "completed" && 
    c.status !== "archived" && 
    (!activeAcademicYear || c.academicYear === activeAcademicYear.yearName)
  );
  
  // Archived/previous CIANNs are those either completed/archived OR not in active academic year
  const archivedCianns = ciannDataList.filter(c => 
    c.status === "completed" || 
    c.status === "archived" || 
    (activeAcademicYear && c.academicYear !== activeAcademicYear.yearName)
  );

  const renderCard = (ciann, isArchived = false) => {
    const subjectName = ciann.subject?.name || "Unknown Subject";
    const subjectCode = ciann.subject?.code || "";
    const classDiv = ciann.class || ciann.division || "—";
    const academicYear = ciann.academicYear || "—";
    const initials = subjectName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <div
        key={ciann._id}
        className={`assess-ciaan-card ${isArchived ? "assess-ciaan-card--archived" : ""} ${loadingExperiments ? "assess-ciaan-card--disabled" : ""}`}
        onClick={() => !loadingExperiments && handleCardClick(ciann)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && !loadingExperiments && handleCardClick(ciann)}
      >
        {/* Top row */}
        <div className="assess-card-top">
          <div className={`assess-card-avatar ${isArchived ? "assess-card-avatar--archived" : ""}`}>
            {initials}
          </div>
          {isArchived && (
            <span className="assess-card-status-pill assess-card-status-pill--archived">
              {ciann.status === "completed" ? "Completed" : "Archived"}
            </span>
          )}
          {!isArchived && (
            <span className="assess-card-status-pill assess-card-status-pill--active">
              Active
            </span>
          )}
        </div>

        {/* Subject Info */}
        <div className="assess-card-body">
          <h3 className="assess-card-subject">{subjectName}</h3>
          {subjectCode && <span className="assess-card-code">{subjectCode}</span>}
        </div>

        {/* Meta pills row */}
        <div className="assess-card-meta">
          <div className="assess-meta-pill">
            <i className="bi bi-hash"></i>
            <span>CIAAN {ciann.ciannId}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-people-fill"></i>
            <span>{classDiv}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-calendar3"></i>
            <span>{academicYear}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="assess-card-footer">
          <button className={`assess-card-btn ${isArchived ? "assess-card-btn--secondary" : ""}`}>
            <i className={`bi ${isArchived ? "bi-eye-fill" : "bi-pencil-fill"}`}></i>
            {loadingExperiments ? "Loading..." : isArchived ? "View Assessment" : "Edit Assessment"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div className="assess-ciaan-page">
        {/* Page Header */}
        <div className="assess-page-header">
          <div className="assess-page-header__inner">
            <div className="assess-page-header__icon">
              <i className="bi bi-clipboard2-check-fill"></i>
            </div>
            <div>
              <h1 className="assess-page-header__title">Edit Assessment</h1>
              <p className="assess-page-header__subtitle">Select a CIAAN to edit student assessments</p>
            </div>
          </div>
          {availableBatches.length > 0 && (
            <div className="assess-batch-info">
              <i className="bi bi-collection-fill"></i>
              <span>Batches: <strong>{availableBatches.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="assess-loading-state">
            <div className="assess-spinner"></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : loadingExperiments ? (
          <div className="assess-loading-state">
            <div className="assess-spinner"></div>
            <p>Fetching experiments...</p>
          </div>
        ) : activeCianns.length === 0 ? (
          <div className="assess-empty-state">
            <i className="bi bi-folder-x"></i>
            <h3>No Active CIAANs Available</h3>
            <p>No active CIAANs for the current academic year.</p>
          </div>
        ) : (
          <div className="assess-sections">
            {/* Active Section Only */}
            <section className="assess-section">
              <div className="assess-section-header">
                <span className="assess-section-dot assess-section-dot--active"></span>
                <h2 className="assess-section-title">Active Semesters</h2>
                <span className="assess-section-count">{activeCianns.length}</span>
              </div>
              <div className="assess-card-grid">
                {activeCianns.map(c => renderCard(c, false))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default EditAssess;
