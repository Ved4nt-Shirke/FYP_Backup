import React, { useState, useEffect } from "react";
import { config } from "../../config/api";
import "./EnableDisablePractical.css";

const EnableDisablePractical = () => {
  const [practicalExams, setPracticalExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchPracticalExams();
  }, [filterBatch]);

  const fetchBatches = async () => {
    try {
      const response = await fetch(config.Ciaans);
      const data = await response.json();
      if (data.Ciaans) {
        const uniqueBatches = [...new Set(data.Ciaans.map((c) => c.batch))];
        setBatches(uniqueBatches);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
    }
  };

  const fetchPracticalExams = async () => {
    try {
      setLoading(true);
      const url = filterBatch
        ? `${config.apiBaseUrl}/practical-exams?batch=${filterBatch}`
        : `${config.apiBaseUrl}/practical-exams`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPracticalExams(data.practicalExams || []);
      } else {
        setError(data.message || "Failed to load practical exams");
      }
    } catch (err) {
      console.error("Error fetching practical exams:", err);
      setError("Failed to load practical exams");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (examId, currentStatus) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setPracticalExams((prev) =>
          prev.map((exam) =>
            exam._id === examId
              ? { ...exam, isEnabled: !exam.isEnabled }
              : exam,
          ),
        );
        setSuccess(
          `Exam ${!currentStatus ? "enabled" : "disabled"} successfully!`,
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update exam status");
      }
    } catch (err) {
      console.error("Error toggling exam status:", err);
      setError("Failed to update exam status");
    }
  };

  if (loading) {
    return (
      <div className="enable-disable-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading practical exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enable-disable-container">
      <div className="edp-hero">
        <div>
          <h1 className="edp-title">Manage Practical Exam Visibility</h1>
          <p className="edp-subtitle">
            Control which practical exams are visible to students using clear
            status controls.
          </p>
        </div>
        <div className="edp-summary">
          <div>
            <span>Total</span>
            <strong>{practicalExams.length}</strong>
          </div>
          <div>
            <span>Visible</span>
            <strong>
              {practicalExams.filter((exam) => exam.isEnabled).length}
            </strong>
          </div>
          <div>
            <span>Hidden</span>
            <strong>
              {practicalExams.filter((exam) => !exam.isEnabled).length}
            </strong>
          </div>
        </div>
      </div>

      <div className="edp-filter-panel">
        <div className="edp-filter-group">
          <label htmlFor="batch" className="edp-filter-label">
            Filter by Batch
          </label>
          <select
            id="batch"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="edp-filter-input"
          >
            <option value="">-- All Batches --</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="edp-alert edp-alert-danger">{error}</div>}
      {success && <div className="edp-alert edp-alert-success">{success}</div>}

      {practicalExams.length === 0 ? (
        <div className="edp-empty-state">
          <i className="bi bi-inbox"></i>
          <p>No practical exams found</p>
          <p className="edp-empty-message">
            Create practical exams to manage their visibility
          </p>
        </div>
      ) : (
        <div className="edp-grid">
          {practicalExams.map((exam) => (
            <article key={exam._id} className="edp-card">
              <header className="edp-card-head">
                <h3>{exam.title}</h3>
                <span
                  className={`edp-status-pill ${exam.isEnabled ? "enabled" : "disabled"}`}
                >
                  <i
                    className={`bi ${exam.isEnabled ? "bi-check-circle" : "bi-x-circle"}`}
                  ></i>
                  {exam.isEnabled ? "Visible to Students" : "Hidden"}
                </span>
              </header>

              <div className="edp-meta-grid">
                <div>
                  <span className="edp-meta-label">Batch</span>
                  <p>{exam.batch || "General"}</p>
                </div>
                <div>
                  <span className="edp-meta-label">Divisions</span>
                  <p>{(exam.divisions || []).join(", ") || "-"}</p>
                </div>
              </div>

              <button
                className={`edp-toggle-btn ${exam.isEnabled ? "disable" : "enable"}`}
                onClick={() => handleToggleStatus(exam._id, exam.isEnabled)}
              >
                {exam.isEnabled
                  ? "Disable for Students"
                  : "Enable for Students"}
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="edp-info-box">
        <h3>Status Information</h3>
        <div className="edp-info-grid">
          <div className="edp-info-item">
            <div className="edp-info-icon enabled">
              <i className="bi bi-check-circle"></i>
            </div>
            <div>
              <h4>Visible to Students</h4>
              <p>Students can access and submit this practical exam.</p>
            </div>
          </div>
          <div className="edp-info-item">
            <div className="edp-info-icon disabled">
              <i className="bi bi-x-circle"></i>
            </div>
            <div>
              <h4>Hidden from Students</h4>
              <p>Students cannot view or attempt this practical exam.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableDisablePractical;
