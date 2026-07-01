// src/Attendance/AssismentCiaanCards.jsx
import React, { useEffect, useState } from "react";
import Header from "../../../basic/Header";
import { useNavigate } from "react-router-dom"; // 👈 import navigate
import "../../components/EditCiann.css";

const ViewAssessmentCard = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 👈 useNavigate hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        const CiaanRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/Ciaans`);
        const CiaanData = await CiaanRes.json();
        setCiaanDataList(CiaanData);
      } catch (err) {
        alert("Failed to fetch Ciaans");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = (CiaanData) => {
    navigate("/view-batch-select", { state: { CiaanData } }); // 👈 pass data to next page
  };

  const renderCiaanCard = (CiaanData) => {
    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
    return (
      <div
        key={CiaanData._id}
        className={`Ciaan-dashboard-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => handleCardClick(CiaanData)}
      >
        <i className="bi bi-pencil-square Ciaan-icon"></i>
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
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div className="edit-Ciaan-page">
        <div className="edit-Ciaan-header">
          <h2 className="text-center py-2 bg-success text-white">
            View Assessment - Select CIAAN
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <p>Loading CIAANs...</p>
          </div>
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
          <p className="text-center">No CIAANs available.</p>
        )}
      </div>
    </>
  );
};

export default ViewAssessmentCard;
