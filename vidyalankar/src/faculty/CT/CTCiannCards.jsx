import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./CTCiannCards.css";

export default function CTCiaanCards() {
  const navigate = useNavigate();
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCiaans = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(config.Ciaans, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch Ciaans");
        }

        setCiaanDataList(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch Ciaans");
      } finally {
        setLoading(false);
      }
    };

    fetchCiaans();
  }, []);

  const handleCardClick = (CiaanData) => {
    navigate(`/ct-dashboard/${CiaanData._id || CiaanData.CiaanId}`, {
      state: { CiaanData },
    });
  };

  const activeCiaans = CiaanDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCiaans = CiaanDataList.filter(c => c.status === "completed" || c.status === "archived");

  return (
    <div className="ct-Ciaan-page">
      <section className="ct-Ciaan-hero">
        <h2>
          <i className="bi bi-journal-check me-2"></i>
          CT - Select CIAAN
        </h2>
        <p>Choose a Ciaan to open the CT marks dashboard.</p>
      </section>

      <section className="ct-Ciaan-grid-wrap">
        {loading ? (
          <p className="ct-Ciaan-state">Loading CIAANs...</p>
        ) : error ? (
          <p className="ct-Ciaan-state ct-Ciaan-error">{error}</p>
        ) : CiaanDataList.length > 0 ? (
          <div>
            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title text-primary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCiaans.length > 0 ? (
                <div className="ct-Ciaan-grid">
                  {activeCiaans.map((CiaanData) => {
                    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
                    return (
                      <article
                        key={CiaanData._id || CiaanData.CiaanId}
                        className={`ct-Ciaan-card ${isArchived ? "archived-card" : ""}`}
                        onClick={() => handleCardClick(CiaanData)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleCardClick(CiaanData);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                      >
                        <div className="ct-Ciaan-card-id">
                          CIAAN ID: {CiaanData.CiaanId}
                          {isArchived && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                              {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
                            </span>
                          )}
                        </div>
                        <h3>{CiaanData.subject?.name || "-"}</h3>
                        <p className="ct-Ciaan-subject-code">
                          {CiaanData.subject?.code || "-"}
                        </p>
                        <p className="ct-Ciaan-meta">
                          Division: {CiaanData.division || "-"}
                        </p>
                        <p className="ct-Ciaan-meta text-muted small" style={{ fontSize: "0.78rem", marginTop: "4px" }}>
                          Academic Year: {CiaanData.academicYear || "-"}
                        </p>
                        <span className="ct-Ciaan-open">{isArchived ? "View Dashboard" : "Open Dashboard"}</span>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No active CIAAN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {archivedCiaans.length > 0 ? (
                <div className="ct-Ciaan-grid">
                  {archivedCiaans.map((CiaanData) => {
                    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
                    return (
                      <article
                        key={CiaanData._id || CiaanData.CiaanId}
                        className={`ct-Ciaan-card ${isArchived ? "archived-card" : ""}`}
                        onClick={() => handleCardClick(CiaanData)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleCardClick(CiaanData);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                      >
                        <div className="ct-Ciaan-card-id">
                          CIAAN ID: {CiaanData.CiaanId}
                          {isArchived && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                              {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
                            </span>
                          )}
                        </div>
                        <h3>{CiaanData.subject?.name || "-"}</h3>
                        <p className="ct-Ciaan-subject-code">
                          {CiaanData.subject?.code || "-"}
                        </p>
                        <p className="ct-Ciaan-meta">
                          Division: {CiaanData.division || "-"}
                        </p>
                        <p className="ct-Ciaan-meta text-muted small" style={{ fontSize: "0.78rem", marginTop: "4px" }}>
                          Academic Year: {CiaanData.academicYear || "-"}
                        </p>
                        <span className="ct-Ciaan-open">{isArchived ? "View Dashboard" : "Open Dashboard"}</span>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIAAN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="ct-Ciaan-state">No Ciaans available.</p>
        )}
      </section>
    </div>
  );
}
