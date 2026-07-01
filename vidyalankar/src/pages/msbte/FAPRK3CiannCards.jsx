import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "../../faculty/components/EditCiann.css";
import "./K3Pages.css";

const FAPRK3CiaanCards = () => {
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
        const token = localStorage.getItem("token");
        const response = await fetch(config.Ciaans, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch Ciaan entries");
        }

        const list = Array.isArray(data) ? data : [];
        const filtered = ownerUsername
          ? list.filter(
            (Ciaan) =>
              String(Ciaan?.ownerUsername || "").trim().toLowerCase() ===
              ownerUsername,
          )
          : list;

        setCiaanDataList(filtered);
      } catch (err) {
        console.error("Error fetching Ciaan entries:", err);
        setError("Failed to load Ciaan entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchCiaans();
  }, [ownerUsername]);

  const handleCardClick = (CiaanData) => {
    navigate("/msbte/fa-pr-k3/generate", { state: { CiaanData } });
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
    <div className="k3-page">
      <div className="k3-page-header">
        <h2>MSBTE Formats (K Scheme)</h2>
        <p>FA-PR-K3 - Select Ciaan</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <p>Loading Ciaan entries...</p>
        </div>
      ) : error ? (
        <p className="k3-error">{error}</p>
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
                <i className="bi bi-info-circle me-2"></i>No active Ciaan workspaces in this section.
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
                <i className="bi bi-info-circle me-2"></i>No archived or completed Ciaan workspaces in this section.
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center">No Ciaan entries found.</p>
      )}
    </div>
  );
};

export default FAPRK3CiaanCards;
