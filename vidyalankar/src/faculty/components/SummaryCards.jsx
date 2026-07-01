import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { config } from "../../config/api";
import { TokenManager } from "../../utils/authUtils.js";
import "../components/EditCiann.css";

const SummaryCards = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCiaans = async () => {
      try {
        const token = TokenManager.getToken();
        if (!token) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        const response = await fetch(config.Ciaans, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch Ciaans");
        }

        const data = await response.json();
        setCiaanDataList(data);
      } catch (err) {
        alert("Failed to fetch Ciaans: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCiaans();
  }, []);

  const handleCardClick = (CiaanData) => {
    localStorage.setItem("CiaanData", JSON.stringify(CiaanData));
    window.open("/edit-Ciaan-print", "_blank");
  };

  const renderCiaanCard = (CiaanData) => {
    const isArchived = CiaanData.status === 'completed' || CiaanData.status === 'archived';

    return (
      <div
        key={CiaanData._id}
        className="Ciaan-dashboard-card-link"
        onClick={() => handleCardClick(CiaanData)}
        style={{ cursor: "pointer" }}
      >
        <div className={`Ciaan-dashboard-card ${isArchived ? 'archived-card' : ''}`}>
          <div className="card-content">
            <i className="bi bi-journal-text Ciaan-icon"></i>
            <div className="Ciaan-id">
              CIAAN ID: {CiaanData.CiaanId}
              {isArchived && (
                <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                  {CiaanData.status === 'completed' ? 'Completed' : 'Archived'}
                </span>
              )}
            </div>
            <div className="card-text">
              <strong>{CiaanData.subject?.name}</strong>
              <span className="subject-code">({CiaanData.subject?.code})</span>
            </div>
            <div className="card-text">
              <span className="division-label">Division:</span> <strong>{CiaanData.division}</strong>
            </div>
            <div className="card-text text-muted small">
              Academic Year: <strong>{CiaanData.academicYear}</strong>
            </div>
          </div>
          <div className="card-hover-text">
            {isArchived ? 'Click to Print Ciaan (Archived)' : 'Click to Print Ciaan'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-Ciaan-page">
        <div className="edit-Ciaan-header">
          <h2 className="text-center py-2 bg-success text-white">Print CIAAN</h2>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : (
          <div>
            {/* Active Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-primary mb-4" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', fontWeight: '700' }}>
                <i className="bi bi-activity me-2"></i>Active Semesters
              </h4>
              {CiaanDataList.filter(c => c.status !== 'completed' && c.status !== 'archived').length > 0 ? (
                <div className="Ciaan-card-container">
                  {CiaanDataList
                    .filter(c => c.status !== 'completed' && c.status !== 'archived')
                    .map(CiaanData => renderCiaanCard(CiaanData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
                  <i className="bi bi-info-circle me-2"></i>No active CIAAN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived / Completed Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', fontWeight: '700', marginTop: '2rem' }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {CiaanDataList.filter(c => c.status === 'completed' || c.status === 'archived').length > 0 ? (
                <div className="Ciaan-card-container">
                  {CiaanDataList
                    .filter(c => c.status === 'completed' || c.status === 'archived')
                    .map(CiaanData => renderCiaanCard(CiaanData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
                  <i className="bi bi-info-circle me-2"></i>No archived or completed CIAAN workspaces in this section.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SummaryCards;
