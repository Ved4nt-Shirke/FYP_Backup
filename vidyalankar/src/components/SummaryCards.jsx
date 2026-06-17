import React, { useEffect, useState } from "react";
import Header from "../basic/Header";
import { config } from "../config/api";
import { TokenManager } from "../utils/authUtils.js";
import "../components/EditCiann.css";

const SummaryCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = TokenManager.getToken();
        if (!token) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        const response = await fetch(config.cianns, {
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
          throw new Error("Failed to fetch CIANNs");
        }

        const data = await response.json();
        setCiannDataList(data);
      } catch (err) {
        alert("Failed to fetch CIANNs: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCianns();
  }, []);

  const handleCardClick = (ciannData) => {
    localStorage.setItem("ciannData", JSON.stringify(ciannData));
    window.open("/edit-ciann-print", "_blank");
  };

  const renderCiannCard = (ciannData) => {
    const isArchived = ciannData.status === 'completed' || ciannData.status === 'archived';

    return (
      <div
        key={ciannData._id}
        className="ciann-dashboard-card-link"
        onClick={() => handleCardClick(ciannData)}
        style={{ cursor: "pointer" }}
      >
        <div className={`ciann-dashboard-card ${isArchived ? 'archived-card' : ''}`}>
          <div className="card-content">
            <i className="bi bi-journal-text ciann-icon"></i>
            <div className="ciann-id">
              CIAAN ID: {ciannData.ciannId}
              {isArchived && (
                <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem', verticalAlign: 'middle' }}>
                  {ciannData.status === 'completed' ? 'Completed' : 'Archived'}
                </span>
              )}
            </div>
            <div className="card-text">
              <strong>{ciannData.subject?.name}</strong>
              <span className="subject-code">({ciannData.subject?.code})</span>
            </div>
            <div className="card-text">
              <span className="division-label">Division:</span> <strong>{ciannData.division}</strong>
            </div>
            <div className="card-text text-muted small">
              Academic Year: <strong>{ciannData.academicYear}</strong>
            </div>
          </div>
          <div className="card-hover-text">
            {isArchived ? 'Click to Print CIANN (Archived)' : 'Click to Print CIANN'}
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

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">Print CIANN</h2>
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
              {ciannDataList.filter(c => c.status !== 'completed' && c.status !== 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {ciannDataList
                    .filter(c => c.status !== 'completed' && c.status !== 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
                  <i className="bi bi-info-circle me-2"></i>No active CIANN workspaces in this section.
                </div>
              )}
            </div>

            {/* Archived / Completed Workspaces Section */}
            <div className="workspace-section-group">
              <h4 className="workspace-section-title text-secondary mb-4" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', fontWeight: '700', marginTop: '2rem' }}>
                <i className="bi bi-archive-fill me-2"></i>Previous Semesters / Archived (Read-Only)
              </h4>
              {ciannDataList.filter(c => c.status === 'completed' || c.status === 'archived').length > 0 ? (
                <div className="ciann-card-container">
                  {ciannDataList
                    .filter(c => c.status === 'completed' || c.status === 'archived')
                    .map(ciannData => renderCiannCard(ciannData))}
                </div>
              ) : (
                <div className="no-workspaces-alert" style={{ padding: '2.5rem', borderRadius: '16px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: '600', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
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

export default SummaryCards;
