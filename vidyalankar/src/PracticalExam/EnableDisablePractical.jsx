import React, { useState, useEffect } from "react";
import { config } from "../config/api";
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
      const response = await fetch(config.cianns);
      const data = await response.json();
      if (data.cianns) {
        const uniqueBatches = [...new Set(data.cianns.map((c) => c.batch))];
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
        }
      );

      const data = await response.json();

      if (data.success) {
        setPracticalExams((prev) =>
          prev.map((exam) =>
            exam._id === examId
              ? { ...exam, isEnabled: !exam.isEnabled }
              : exam
          )
        );
        setSuccess(
          `Exam ${!currentStatus ? "enabled" : "disabled"} successfully!`
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
      <div className="page-header">
        <h1 className="page-title">Manage Practical Exam Visibility</h1>
        <p className="page-subtitle">
          Enable or disable practical exams for students
        </p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="batch" className="filter-label">
            Filter by Batch
          </label>
          <select
            id="batch"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="filter-input"
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

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {practicalExams.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No practical exams found</p>
          <p className="empty-message">
            Create practical exams to manage their visibility
          </p>
        </div>
      ) : (
        <div className="status-table-wrapper">
          <div className="table-responsive">
            <table className="status-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Batch</th>
                  <th>Divisions</th>
                  <th>Current Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {practicalExams.map((exam) => (
                  <tr key={exam._id}>
                    <td className="title-cell">{exam.title}</td>
                    <td>{exam.batch}</td>
                    <td>
                      <span className="divisions-list">
                        {exam.divisions.join(", ")}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          exam.isEnabled ? "enabled" : "disabled"
                        }`}
                      >
                        <i
                          className={`bi ${
                            exam.isEnabled ? "bi-check-circle" : "bi-x-circle"
                          }`}
                        ></i>
                        {exam.isEnabled ? "Visible to Students" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-toggle ${
                          exam.isEnabled ? "btn-disable" : "btn-enable"
                        }`}
                        onClick={() =>
                          handleToggleStatus(exam._id, exam.isEnabled)
                        }
                      >
                        {exam.isEnabled ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="status-info-box">
        <h3>Status Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon enabled">
              <i className="bi bi-check-circle"></i>
            </div>
            <div>
              <h4>Visible to Students</h4>
              <p>Students can access and view the practical exam</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon disabled">
              <i className="bi bi-x-circle"></i>
            </div>
            <div>
              <h4>Hidden from Students</h4>
              <p>Students cannot see or access this exam</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableDisablePractical;
