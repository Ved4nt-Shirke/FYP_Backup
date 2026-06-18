import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import { fetchCiannsWithAuth } from "../../utils/ciannFetch";
import "./AttendanceCiannSelector.css";

const AttendanceCiannSelector = ({
  title,
  subtitle,
  navigateTo,
  onSelectState = (ciannData) => ({ ciannData }),
  onSelect,
  iconClass = "bi-book-half",
  continueLabel = "Continue",
}) => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ciannData = await fetchCiannsWithAuth();
        setCiannDataList(ciannData || []);
      } catch (err) {
        alert("Failed to fetch CIANNs: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === "completed" || ciannData.status === "archived";
    return (
      <button
        type="button"
        key={ciannData._id}
        className={`ats-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => {
          if (typeof onSelect === "function") {
            onSelect(ciannData, navigate);
            return;
          }
          navigate(navigateTo, { state: onSelectState(ciannData) });
        }}
      >
        <div className="ats-card-top">
          <div className="ats-card-icon" aria-hidden="true">
            <i className={`bi ${iconClass}`}></i>
          </div>
          <div className="ats-card-headtext">
            <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              {ciannData.subject?.name || "Unknown Subject"}
              {isArchived && (
                <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '3px 6px', display: 'inline-block' }}>
                  {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
                </span>
              )}
            </h3>
            <p className="ats-code">{ciannData.subject?.code || "-"}</p>
          </div>
        </div>

        <div className="ats-details">
          <div className="ats-row">
            <span className="ats-label">CIANN ID</span>
            <span className="ats-value">{ciannData.ciannId || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Semester</span>
            <span className="ats-value">{ciannData.semester || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Division</span>
            <span className="ats-value">{ciannData.division || "-"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Department</span>
            <span className="ats-value">{ciannData.department?.name || "Department"}</span>
          </div>
          <div className="ats-row">
            <span className="ats-label">Academic Year</span>
            <span className="ats-value">{ciannData.academicYear || "-"}</span>
          </div>
        </div>

        <div className="ats-card-footer">
          {continueLabel} <i className="bi bi-arrow-right"></i>
        </div>
      </button>
    );
  };

  const activeCianns = ciannDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCianns = ciannDataList.filter(c => c.status === "completed" || c.status === "archived");

  return (
    <>
      <Header showSearch={false} />
      <div className="ats-page">
        <section className="ats-hero">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </section>

        {loading ? (
          <div className="ats-state">Loading CIANNs...</div>
        ) : ciannDataList.length === 0 ? (
          <div className="ats-state">No CIANNs available.</div>
        ) : (
          <div className="container py-2">
            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title text-primary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCianns.length > 0 ? (
                <section className="ats-grid">
                  {activeCianns.map((ciannData) => renderCiannCard(ciannData))}
                </section>
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
                <section className="ats-grid">
                  {archivedCianns.map((ciannData) => renderCiannCard(ciannData))}
                </section>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIANN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceCiannSelector;
