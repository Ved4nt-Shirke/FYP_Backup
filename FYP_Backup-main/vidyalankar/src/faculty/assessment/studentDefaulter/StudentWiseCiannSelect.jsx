// src/faculty/Assessment/studentDefaulter/StudentWiseCiaanSelect.jsx
import React, { useEffect, useState, useCallback } from "react";
import Header from "../../../basic/Header";
import { useNavigate } from "react-router-dom";
import "../assess/AssessCiaan.css";

const API = () =>
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(
    /\/api$/,
    ""
  );

const StudentWiseCiaanSelect = () => {
  const [CiaanDataList, setCiaanDataList] = useState([]);
  const [assessedCiaanIds, setAssessedCiaanIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active academic year first
      const yearRes = await fetch(`${API()}/api/academic-year/current`);
      const yearData = await yearRes.json();
      if (yearData.success) setActiveAcademicYear(yearData.academicYear);

      const CiaanRes = await fetch(`${API()}/api/Ciaans`);
      const CiaanData = await CiaanRes.json();
      setCiaanDataList(CiaanData);

      const batchesRes = await fetch(`${API()}/api/assessments/batches`);
      const batchesData = await batchesRes.json();
      if (batchesData.success) setAvailableBatches(batchesData.batches);

      // Fetch all assessed CiaanIds so we only show Ciaans that have been assessed
      try {
        const assessedRes = await fetch(
          `${API()}/api/assessments/assessed-experiments`
        );
        const assessedData = await assessedRes.json();
        if (assessedData.success && Array.isArray(assessedData.CiaanIds)) {
          setAssessedCiaanIds(new Set(assessedData.CiaanIds));
        } else {
          // Fallback: treat all as having assessments if endpoint doesn't return CiaanIds
          setAssessedCiaanIds(null);
        }
      } catch (_) {
        setAssessedCiaanIds(null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener("academicYearChanged", fetchData);
    return () => window.removeEventListener("academicYearChanged", fetchData);
  }, [fetchData]);

  const handleCardClick = async (CiaanData) => {
    setLoadingExperiments(true);
    try {
      // Fetch assessed experiments for THIS Ciaan specifically
      const params = new URLSearchParams();
      if (CiaanData.CiaanId) params.append("CiaanId", CiaanData.CiaanId);
      const experimentsRes = await fetch(
        `${API()}/api/assessments/assessed-experiments?${params.toString()}`
      );
      const experimentsData = await experimentsRes.json();

      // Fetch division-scoped batches
      const batchParams = new URLSearchParams();
      if (CiaanData.division) batchParams.append("division", CiaanData.division);
      if (CiaanData.CiaanId) batchParams.append("CiaanId", CiaanData.CiaanId);
      let batches = availableBatches;
      try {
        const batchRes = await fetch(
          `${API()}/api/assessments/batches?${batchParams.toString()}`
        );
        const batchData = await batchRes.json();
        if (batchData.success && batchData.batches.length > 0)
          batches = batchData.batches;
      } catch (_) { }

      navigate("/studentwise-select", {
        state: {
          CiaanData,
          // Only pass experiments that have been assessed for this Ciaan
          experiments: experimentsData.success
            ? experimentsData.experiments || []
            : [],
          availableBatches: batches,
        },
      });
    } catch (error) {
      console.error("Error fetching experiments:", error);
      navigate("/studentwise-select", {
        state: { CiaanData, experiments: [], availableBatches },
      });
    } finally {
      setLoadingExperiments(false);
    }
  };

  // Filter Ciaans: only active year and not completed/archived
  const activeCiaans = CiaanDataList.filter(
    (c) =>
      c.status !== "completed" &&
      c.status !== "archived" &&
      (!activeAcademicYear || c.academicYear === activeAcademicYear.yearName)
  );

  const renderCard = (Ciaan) => {
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
        className={`assess-ciaan-card ${loadingExperiments ? "assess-ciaan-card--disabled" : ""
          }`}
        onClick={() => !loadingExperiments && handleCardClick(Ciaan)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === "Enter" && !loadingExperiments && handleCardClick(Ciaan)
        }
      >
        {/* Top row */}
        <div className="assess-card-top">
          <div className="assess-card-avatar">{initials}</div>
          <span className="assess-card-status-pill assess-card-status-pill--active">
            Active
          </span>
        </div>

        {/* Subject Info */}
        <div className="assess-card-body">
          <h3 className="assess-card-subject">{subjectName}</h3>
          {subjectCode && (
            <span className="assess-card-code">{subjectCode}</span>
          )}
        </div>

        {/* Meta pills row */}
        <div className="assess-card-meta">
          <div className="assess-meta-pill">
            <i className="bi bi-hash"></i>
            <span>CIAAN {Ciaan.CiaanId}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-people-fill"></i>
            <span>{classDiv}</span>
          </div>
          <div className="assess-meta-pill">
            <i className="bi bi-calendar3"></i>
            <span>{academicYear}</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="assess-card-footer">
          <button className="assess-card-btn">
            <i className="bi bi-person-check-fill"></i>
            {loadingExperiments ? "Loading..." : "Select Student"}
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
        <div className="assess-page-header">
          <div className="assess-page-header__inner">
            <div className="assess-page-header__icon">
              <i className="bi bi-person-lines-fill"></i>
            </div>
            <div>
              <h1 className="assess-page-header__title">
                Student-wise Defaulter
              </h1>
              <p className="assess-page-header__subtitle">
                Select a CIAAN to view student-wise assessments
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
            <div className="assess-spinner"></div>
            <p>Loading CIAANs...</p>
          </div>
        ) : loadingExperiments ? (
          <div className="assess-loading-state">
            <div className="assess-spinner"></div>
            <p>Fetching experiments...</p>
          </div>
        ) : activeCiaans.length === 0 ? (
          <div className="assess-empty-state">
            <i className="bi bi-folder-x"></i>
            <h3>No Active CIAANs Available</h3>
            <p>No active CIAANs for the current academic year.</p>
          </div>
        ) : (
          <div className="assess-sections">
            {/* Active Section Only */}
            <section className="assess-section">
              <div className="assess-section-header">
                <span className="assess-section-dot assess-section-dot--active"></span>
                <h2 className="assess-section-title">Active Semesters</h2>
                <span className="assess-section-count">
                  {activeCiaans.length}
                </span>
              </div>
              <div className="assess-card-grid">
                {activeCiaans.map((c) => renderCard(c))}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentWiseCiaanSelect;
