import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "../faculty/components/EditCiann.css";
import "./k4.css";

const K4CiannCards = ({ mode, title }) => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ownerUsername = useMemo(() => {
    return (localStorage.getItem("username") || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        setLoading(true);
        const response = await axios.get(config.cianns);
        const data = Array.isArray(response.data) ? response.data : [];
        const filtered = ownerUsername
          ? data.filter(
              (ciann) =>
                String(ciann?.ownerUsername || "")
                  .trim()
                  .toLowerCase() === ownerUsername,
            )
          : data;
        setCiannDataList(filtered);
      } catch (err) {
        console.error("Error fetching CIANNs:", err);
        setError("Failed to load CIANN entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, [ownerUsername]);

  const handleCardClick = (ciannData) => {
    if (mode === "print") {
      navigate(`/msbte/k4/${mode}/view`, { state: { ciannData } });
      return;
    }
    navigate(`/msbte/k4/${mode}/form`, { state: { ciannData } });
  };

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === "completed" || ciannData.status === "archived";
    return (
      <div
        key={ciannData._id}
        className={`ciann-dashboard-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => handleCardClick(ciannData)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick(ciannData);
          }
        }}
      >
        <div className="ciann-id">
          CIAAN ID: {ciannData.ciannId}
          {isArchived && (
            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
              {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
            </span>
          )}
        </div>
        <p className="card-text">
          <strong>{ciannData.subject?.name}</strong>
          <br />({ciannData.subject?.code})
        </p>
        <p className="card-text">
          Division: <strong>{ciannData.division}</strong>
        </p>
        <p className="card-text text-muted small" style={{ marginTop: "4px", fontSize: "0.8rem" }}>
          Academic Year: <strong>{ciannData.academicYear}</strong>
        </p>
      </div>
    );
  };

  const activeCianns = ciannDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCianns = ciannDataList.filter(c => c.status === "completed" || c.status === "archived");

  return (
    <>
      <Header showSearch={false} />
      <div className="k4-page">
        <div className="k4-page-header">
          <h2>MSBTE Formats (K Scheme)</h2>
          <p>{title}</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <p>Loading CIANN entries...</p>
          </div>
        ) : error ? (
          <p className="k4-error">{error}</p>
        ) : ciannDataList.length > 0 ? (
          <div className="container py-2">
            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title text-primary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCianns.length > 0 ? (
                <div className="ciann-card-container">
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
                <div className="ciann-card-container">
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
          <p className="text-center">No CIANN entries found.</p>
        )}
      </div>
    </>
  );
};

export default K4CiannCards;
