import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "../faculty/components/EditCiann.css";
import "./k4.css";

const K4CiaanCards = ({ mode, title }) => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ownerUsername = useMemo(() => {
    return (localStorage.getItem("username") || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    const fetchCiaans = async () => {
      try {
        setLoading(true);
        const response = await axios.get(config.Ciaans);
        const data = Array.isArray(response.data) ? response.data : [];
        const filtered = ownerUsername
          ? data.filter(
            (Ciaan) =>
              String(Ciaan?.ownerUsername || "")
                .trim()
                .toLowerCase() === ownerUsername,
          )
          : data;
        setCiaanDataList(filtered);
      } catch (err) {
        console.error("Error fetching Ciaans:", err);
        setError("Failed to load Ciaan entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchCiaans();
  }, [ownerUsername]);

  const handleCardClick = (CiaanData) => {
    if (mode === "print") {
      navigate(`/msbte/k4/${mode}/view`, { state: { CiaanData } });
      return;
    }
    navigate(`/msbte/k4/${mode}/form`, { state: { CiaanData } });
  };

  const renderCiaanCard = (CiaanData) => {
    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
    return (
      <div
        key={CiaanData._id}
        className={`Ciaan-dashboard-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => handleCardClick(CiaanData)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick(CiaanData);
          }
        }}
      >
        <div className="Ciaan-id">
          CIAAN ID: {CiaanData.CiaanId}
          {isArchived && (
            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
              {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
            </span>
          )}
        </div>
        <p className="card-text">
          <strong>{CiaanData.subject?.name}</strong>
          <br />({CiaanData.subject?.code})
        </p>
        <p className="card-text">
          Division: <strong>{CiaanData.division}</strong>
        </p>
        <p className="card-text text-muted small" style={{ marginTop: "4px", fontSize: "0.8rem" }}>
          Academic Year: <strong>{CiaanData.academicYear}</strong>
        </p>
      </div>
    );
  };

  const activeCiaans = CiaanDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCiaans = CiaanDataList.filter(c => c.status === "completed" || c.status === "archived");

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
            <p>Loading CIAAN entries...</p>
          </div>
        ) : error ? (
          <p className="k4-error">{error}</p>
        ) : CiaanDataList.length > 0 ? (
          <div className="container py-2">
            {/* Active Workspaces Section */}
            <div className="workspace-section-group mb-5">
              <h4 className="workspace-section-title text-primary mb-4" style={{ display: "flex", alignItems: "center", fontWeight: "700" }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {activeCiaans.length > 0 ? (
                <div className="Ciaan-card-container">
                  {activeCiaans.map((CiaanData) => renderCiaanCard(CiaanData))}
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
                <div className="Ciaan-card-container">
                  {archivedCiaans.map((CiaanData) => renderCiaanCard(CiaanData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(0,0,0,0.12)", borderRadius: "8px", padding: "1.5rem", textAlign: "center", color: "rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIAAN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center">No CIAAN entries found.</p>
        )}
      </div>
    </>
  );
};

export default K4CiaanCards;
