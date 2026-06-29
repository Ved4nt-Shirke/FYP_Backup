import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./CTCiannCards.css";

export default function CTCiannCards() {
  const navigate = useNavigate();
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(config.cianns, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch CIANNs");
        }

        setCiannDataList(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch CIANNs");
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, []);

  const handleCardClick = (ciannData) => {
    navigate(`/ct-dashboard/${ciannData.ciannId}`, { state: { ciannData } });
  };

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === "completed" || ciannData.status === "archived";
    return (
      <article
        key={ciannData._id || ciannData.ciannId}
        className={`ct-ciann-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => handleCardClick(ciannData)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick(ciannData);
          }
        }}
        tabIndex={0}
        role="button"
      >
        <div className="ct-ciann-card-id">
          CIANN ID: {ciannData.ciannId}
          {isArchived && (
            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
              {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
            </span>
          )}
        </div>
        <h3>{ciannData.subject?.name || "-"}</h3>
        <p className="ct-ciann-subject-code">
          {ciannData.subject?.code || "-"}
        </p>
        <p className="ct-ciann-meta">
          Division: {ciannData.division || "-"}
        </p>
        <p className="ct-ciann-meta text-muted small" style={{ fontSize: "0.78rem", marginTop: "4px" }}>
          Academic Year: {ciannData.academicYear || "-"}
        </p>
        <span className="ct-ciann-open">{isArchived ? "View Dashboard" : "Open Dashboard"}</span>
      </article>
    );
  };

  const activeCianns = ciannDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCianns = ciannDataList.filter(c => c.status === "completed" || c.status === "archived");

  return (
    <div className="ct-ciann-page">
      <section className="ct-ciann-hero">
        <h2>
          <i className="bi bi-journal-check me-2"></i>
          CT - Select CIANN
        </h2>
        <p>Choose a CIANN to open the CT marks dashboard.</p>
      </section>

      <section className="ct-ciann-grid-wrap">
        {loading ? (
          <p className="ct-ciann-state">Loading CIANNs...</p>
        ) : error ? (
          <p className="ct-ciann-state ct-ciann-error">{error}</p>
        ) : ciannDataList.length > 0 ? (
          <div>
            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title text-primary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCianns.length > 0 ? (
                <div className="ct-ciann-grid">
                  {activeCianns.map((ciannData) => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No active CIANN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {archivedCianns.length > 0 ? (
                <div className="ct-ciann-grid">
                  {archivedCianns.map((ciannData) => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIANN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="ct-ciann-state">No CIANNs available.</p>
        )}
      </section>
    </div>
  );
}
