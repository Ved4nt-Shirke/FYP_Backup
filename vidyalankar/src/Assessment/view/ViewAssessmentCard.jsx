// src/Attendance/AssismentCiaanCards.jsx
import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom"; // 👈 import navigate
import "../../components/EditCiann.css";

const ViewAssessmentCard = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 👈 useNavigate hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ciannRes = await fetch("http://localhost:5000/api/cianns");
        const ciannData = await ciannRes.json();
        setCiannDataList(ciannData);
      } catch (err) {
        alert("Failed to fetch CIANNs");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = (ciannData) => {
    navigate("/view-batch-select", { state: { ciannData } }); // 👈 pass data to next page
  };

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === "completed" || ciannData.status === "archived";
    return (
      <div
        key={ciannData._id}
        className={`ciann-dashboard-card ${isArchived ? "archived-card" : ""}`}
        onClick={() => handleCardClick(ciannData)}
      >
        <i className="bi bi-pencil-square ciann-icon"></i>
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
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            View Assessment - Select CIAAN
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-5">
            <p>Loading CIAANs...</p>
          </div>
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
          <p className="text-center">No CIAANs available.</p>
        )}
      </div>
    </>
  );
};

export default ViewAssessmentCard;
