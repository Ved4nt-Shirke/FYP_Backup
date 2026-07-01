// src/Assessment/edit/EditCard.jsx
import React, { useEffect, useState } from "react";
import Header from "../../../basic/Header";
import { useNavigate } from "react-router-dom";
import "../assess/AssessCiann.css";

const API = () =>
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
    /\/api$/,
    ""
  );

const EditCard = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const yearRes = await fetch(`${API()}/api/academic-year/current`);
      const yearData = await yearRes.json();
      if (yearData.success) setActiveAcademicYear(yearData.academicYear);

      const CiaanRes = await fetch(`${API()}/api/Ciaans`);
      const CiaanData = await CiaanRes.json();
      setCiaanDataList(CiaanData);

      const batchesRes = await fetch(`${API()}/api/assessments/batches`);
      const batchesData = await batchesRes.json();
      if (batchesData.success) setAvailableBatches(batchesData.batches);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for academic year changes from Header
    const handler = () => fetchData();
    window.addEventListener("academicYearChanged", handler);
    return () => window.removeEventListener("academicYearChanged", handler);
  }, []);

  // Navigate directly to batch select (bypass /edit-assess)
  const handleCardClick = async (CiaanData) => {
    setLoadingBatch(true);
    try {
      // Fetch batches scoped to this Ciaan's division
      const params = new URLSearchParams();
      if (CiaanData.division) params.append("division", CiaanData.division);
      if (CiaanData.CiaanId) params.append("CiaanId", CiaanData.CiaanId);

      const batchRes = await fetch(
        `${API()}/api/assessments/batches?${params.toString()}`
      );
      const batchData = await batchRes.json();
      const batches =
        batchData.success && batchData.batches.length > 0
          ? batchData.batches
          : availableBatches;

      navigate("/edit-batch-select", {
        state: {
          CiaanData,
          availableBatches: batches,
          experiments: [],
        },
      });
    } catch (error) {
      console.error("Error fetching batches:", error);
      navigate("/edit-batch-select", {
        state: { CiaanData, availableBatches, experiments: [] },
      });
    } finally {
      setLoadingBatch(false);
    }
  };

  const activeCiaans = CiaanDataList.filter(
    (c) =>
      c.status !== "completed" &&
      c.status !== "archived" &&
      (!activeAcademicYear || c.academicYear === activeAcademicYear.yearName)
  );
  const archivedCiaans = CiaanDataList.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "archived" ||
      (activeAcademicYear && c.academicYear !== activeAcademicYear.yearName)
  );

  const renderCard = (Ciaan, isArchived = false) => {
    const subjectName = Ciaan.subject?.name || "Unknown Subject";
    const subjectCode = Ciaan.subject?.code || "";
    const classDiv = Ciaan.class || Ciaan.division || "—";
    const academicYear = Ciaan.academicYear || "—";
    const initials = subjectName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        key={Ciaan._id}
        className={`assess-ciaan-card ${isArchived ? "assess-ciaan-card--archived" : ""
          } ${loadingBatch ? "assess-ciaan-card--disabled" : ""}`}
        onClick={() => !loadingBatch && handleCardClick(Ciaan)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === "Enter" && !loadingBatch && handleCardClick(Ciaan)
        }
      >
        {/* Top row */}
        <div className="assess-card-top">
          <div
            className={`assess-card-avatar ${isArchived ? "assess-card-avatar--archived" : ""
              }`}
            style={
              !isArchived
                ? {
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                }
                : {}
            }
          >
            {initials}
          </div>
          {isArchived ? (
            <span className="assess-card-status-pill assess-card-status-pill--archived">
              {Ciaan.status === "completed" ? "Completed" : "Previous Year"}
            </span>
          ) : (
            <span
              className="assess-card-status-pill"
              style={{
                background: "#f3e8ff",
                color: "#7c3aed",
                border: "1px solid #e9d5ff",
              }}
            >
              Edit Mode
            </span>
          )}
        </div>

        {/* Subject Info */}
        <div className="assess-card-body">
          <h3 className="assess-card-subject">{subjectName}</h3>
          {subjectCode && (
            <span className="assess-card-code">{subjectCode}</span>
          )}
        </div>

        {/* Meta pills */}
        <div className="assess-card-meta">
          <div className="assess-meta-pill">
            <i className="bi bi-hash" style={{ color: "#7c3aed" }}></i>
            <span>CIAAN {Ciaan.CiaanId}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-people-fill" style={{ color: "#7c3aed" }}></i>
            <span>{classDiv}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-calendar3" style={{ color: "#7c3aed" }}></i>
            <span>{academicYear}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="assess-card-footer">
          <button
            className="assess-card-btn"
            style={
              !isArchived
                ? {
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                }
                : {}
            }
          >
            <i
              className={`bi ${isArchived ? "bi-eye-fill" : "bi-pencil-fill"}`}
            ></i>
            {loadingBatch
              ? "Loading..."
              : isArchived
                ? "View Assessment"
                : "Edit Assessment"}
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
          style={{
            background:
              "linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a78bfa 100%)",
          }}
        >
          <div className="assess-page-header__inner">
            <div className="assess-page-header__icon">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div>
              <h1 className="assess-page-header__title">Edit Assessment</h1>
              <p className="assess-page-header__subtitle">
                Select a CIAAN to edit or review existing assessment records
              </p>
            </div>
          </div>
          {activeAcademicYear && (
            <div className="assess-batch-info">
              <i className="bi bi-mortarboard-fill"></i>
              <span>
                Year:{" "}
                <strong>
                  {activeAcademicYear.yearName || activeAcademicYear}
                </strong>
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="assess-loading-state">
            <div
              className="assess-spinner"
              style={{ borderTopColor: "#7c3aed" }}
            ></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : loadingBatch ? (
          <div className="assess-loading-state">
            <div
              className="assess-spinner"
              style={{ borderTopColor: "#7c3aed" }}
            ></div>
            <p>Loading batches...</p>
          </div>
        ) : CiaanDataList.length === 0 ? (
          <div className="assess-empty-state">
            <i className="bi bi-folder-x"></i>
            <h3>No CIAANs Available</h3>
            <p>Create a CIAAN first to edit assessments.</p>
          </div>
        ) : (
          <div className="assess-sections">
            <section className="assess-section">
              <div className="assess-section-header">
                <span
                  className="assess-section-dot"
                  style={{ background: "#7c3aed" }}
                ></span>
                <h2 className="assess-section-title">Active Semesters</h2>
                <span
                  className="assess-section-count"
                  style={{ background: "#f3e8ff", color: "#7c3aed" }}
                >
                  {activeCiaans.length}
                </span>
              </div>
              {activeCiaans.length > 0 ? (
                <div className="assess-card-grid">
                  {activeCiaans.map((c) => renderCard(c, false))}
                </div>
              ) : (
                <div className="assess-empty-section">
                  <i className="bi bi-info-circle"></i> No active CIAAN
                  workspaces for the current academic year.
                </div>
              )}
            </section>

            {archivedCiaans.length > 0 && (
              <section className="assess-section">
                <div className="assess-section-header">
                  <span className="assess-section-dot assess-section-dot--archived"></span>
                  <h2 className="assess-section-title assess-section-title--muted">
                    Previous Semesters
                  </h2>
                  <span className="assess-section-count assess-section-count--muted">
                    {archivedCiaans.length}
                  </span>
                </div>
                <div className="assess-card-grid">
                  {archivedCiaans.map((c) => renderCard(c, true))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EditCard;
