// src/Attendance/PracticalCiaanCards.jsx
import React, { useEffect, useState } from "react";
import { fetchCiaansWithAuth } from "../../../utils/ciannFetch";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import "../components/EditCiann.css";

const ViewPracticalCiaanCards = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const CiaanData = await fetchCiaansWithAuth();
        setCiaanDataList(CiaanData);
      } catch (err) {
        alert("Failed to fetch Ciaans: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
            Practical Attendance - Select CIAAN
          </h2>
        </div>
  const renderCiaanCard = (CiaanData) => {
    const isArchived = CiaanData.status === "completed" || CiaanData.status === "archived";
        return (
        <div
          key={CiaanData._id}
          className={`Ciaan-dashboard-card ${isArchived ? "archived-card" : ""}`}
          onClick={() => navigate("/Batch-selection-page1", { state: { CiaanData } })}
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
                Practical Attendance - Select CIAAN
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <p>Loading Ciaans...</p>
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
              <p className="text-center">No CIAANs available.</p>
            )}
          </div>
        </>
        );
};

        export default ViewPracticalCiaanCards;
