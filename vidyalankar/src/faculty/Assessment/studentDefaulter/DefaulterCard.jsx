// src/Assessment/studentDefaulter/DefaulterCard.jsx
import React, { useEffect, useState } from "react";
import Header from "../../../basic/Header";
import { useNavigate } from "react-router-dom";
import "../assess/AssessCiaan.css";

const DefaulterCard = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "");

        // Fetch all CIANNs
        const ciannRes = await fetch(`${BASE}/api/cianns`);
        const allCianns = await ciannRes.json();

        // Fetch CIAANs that have at least one saved assessment
        let assessedCiannIds = [];
        try {
          const assessedRes = await fetch(`${BASE}/api/assessments/assessed-cianns`);
          const assessedData = await assessedRes.json();
          if (assessedData.success) {
            assessedCiannIds = assessedData.ciannIds.map(id => Number(id));
          }
        } catch (e) {
          console.warn("Could not fetch assessed CIAANs, showing all:", e);
          // fallback: show all CIAANs if endpoint fails
          assessedCiannIds = allCianns.map(c => Number(c.ciannId));
        }

        // Filter to only CIANNs that have been assessed
        const filteredCianns = allCianns.filter(c => assessedCiannIds.includes(Number(c.ciannId)));
        setCiannDataList(filteredCianns);

        // Fetch available batches
        const batchesRes = await fetch(`${BASE}/api/assessments/batches`);
        const batchesData = await batchesRes.json();
        if (batchesData.success) {
          setAvailableBatches(batchesData.batches);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = (ciannData) => {
    navigate("/studentwise-select", {
      state: {
        ciannData,
        availableBatches,
      },
    });
  };

  const activeCianns = ciannDataList.filter(c => c.status !== "completed" && c.status !== "archived");
  const archivedCianns = ciannDataList.filter(c => c.status === "completed" || c.status === "archived");

  const renderCard = (ciann, isArchived = false) => {
    const subjectName = ciann.subject?.name || "Unknown Subject";
    const subjectCode = ciann.subject?.code || "";
    const classDiv = ciann.class || ciann.division || "—";
    const academicYear = ciann.academicYear || "—";
    const initials = subjectName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
      <div
        key={ciann._id}
        className={`assess-ciaan-card ${isArchived ? "assess-ciaan-card--archived" : ""}`}
        onClick={() => handleCardClick(ciann)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && handleCardClick(ciann)}
      >
        {/* Top row */}
        <div className="assess-card-top">
          <div
            className={`assess-card-avatar ${isArchived ? "assess-card-avatar--archived" : ""}`}
            style={!isArchived ? { background: "linear-gradient(135deg, #dc2626 0%, #f87171 100%)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" } : {}}
          >
            {initials}
          </div>
          {isArchived ? (
            <span className="assess-card-status-pill assess-card-status-pill--archived">
              {ciann.status === "completed" ? "Completed" : "Archived"}
            </span>
          ) : (
            <span className="assess-card-status-pill" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
              Assessed
            </span>
          )}
        </div>

        {/* Subject Info */}
        <div className="assess-card-body">
          <h3 className="assess-card-subject">{subjectName}</h3>
          {subjectCode && <span className="assess-card-code">{subjectCode}</span>}
        </div>

        {/* Meta pills */}
        <div className="assess-card-meta">
          <div className="assess-meta-pill">
            <i className="bi bi-hash" style={{ color: "#dc2626" }}></i>
            <span>CIAAN {ciann.ciannId}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-people-fill" style={{ color: "#dc2626" }}></i>
            <span>{classDiv}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-calendar3" style={{ color: "#dc2626" }}></i>
            <span>{academicYear}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="assess-card-footer">
          <button
            className="assess-card-btn"
            style={!isArchived ? { background: "linear-gradient(135deg, #dc2626 0%, #f87171 100%)", boxShadow: "0 4px 12px rgba(220,38,38,0.25)" } : {}}
          >
            <i className="bi bi-person-exclamation-fill"></i>
            View Studentwise
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div className="assess-ciaan-page">
        {/* Page Header */}
        <div
          className="assess-page-header"
          style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #f87171 100%)" }}
        >
          <div className="assess-page-header__inner">
            <div className="assess-page-header__icon">
              <i className="bi bi-person-exclamation-fill"></i>
            </div>
            <div>
              <h1 className="assess-page-header__title">Studentwise Assessment</h1>
              <p className="assess-page-header__subtitle">
                Only CIAANs with saved assessments are shown below
              </p>
            </div>
          </div>
          {availableBatches.length > 0 && (
            <div className="assess-batch-info">
              <i className="bi bi-collection-fill"></i>
              <span>Batches: <strong>{availableBatches.join(", ")}</strong></span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="assess-loading-state">
            <div className="assess-spinner" style={{ borderTopColor: "#dc2626" }}></div>
            <p>Loading assessed CIAANs...</p>
          </div>
        ) : ciannDataList.length === 0 ? (
          <div className="assess-empty-state">
            <i className="bi bi-clipboard2-x"></i>
            <h3>No Assessed CIAANs</h3>
            <p>No assessments have been recorded yet. Complete an assessment first.</p>
          </div>
        ) : (
          <div className="assess-sections">
            {/* Active Section */}
            {activeCianns.length > 0 && (
              <section className="assess-section">
                <div className="assess-section-header">
                  <span className="assess-section-dot" style={{ background: "#dc2626" }}></span>
                  <h2 className="assess-section-title">Active Semesters</h2>
                  <span className="assess-section-count" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    {activeCianns.length}
                  </span>
                </div>
                <div className="assess-card-grid">
                  {activeCianns.map(c => renderCard(c, false))}
                </div>
              </section>
            )}

            {/* Archived Section */}
            {archivedCianns.length > 0 && (
              <section className="assess-section">
                <div className="assess-section-header">
                  <span className="assess-section-dot assess-section-dot--archived"></span>
                  <h2 className="assess-section-title assess-section-title--muted">Previous Semesters</h2>
                  <span className="assess-section-count assess-section-count--muted">{archivedCianns.length}</span>
                </div>
                <div className="assess-card-grid">
                  {archivedCianns.map(c => renderCard(c, true))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DefaulterCard;
