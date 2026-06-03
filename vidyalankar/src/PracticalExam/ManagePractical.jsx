import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./ManagePractical.css";

const ManagePractical = () => {
  const navigate = useNavigate();
  const [practicalExams, setPracticalExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [batches, setBatches] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchPracticalExams();
    fetchBatches();
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

  const handleDelete = async (examId) => {
    if (!deleteConfirm || deleteConfirm !== examId) {
      setDeleteConfirm(examId);
      return;
    }

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/${examId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setPracticalExams((prev) => prev.filter((exam) => exam._id !== examId));
        setDeleteConfirm(null);
      } else {
        setError(data.message || "Failed to delete exam");
      }
    } catch (err) {
      console.error("Error deleting exam:", err);
      setError("Failed to delete exam");
    }
  };

  const handleEdit = (examId) => {
    navigate(`/faculty/practical-exams/edit/${examId}`);
  };

  const handleViewQuestions = (examId) => {
    navigate(`/faculty/practical-exams/questions/${examId}`);
  };

  const handleViewResponses = (examId) => {
    navigate(`/faculty/practical-exams/${examId}/responses`);
  };

  const filteredExams = practicalExams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalExams = practicalExams.length;
  const totalFiltered = filteredExams.length;
  const totalEnabled = practicalExams.filter((exam) => exam.isEnabled).length;

  if (loading) {
    return (
      <div className="manage-practical-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading practical exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-practical-container">
      <div className="manage-practical-hero">
        <div className="mp-hero-copy">
          <h1 className="mp-title">Manage Practical Exams</h1>
          <p className="mp-subtitle">
            Find exams quickly and use clear action buttons to edit structure,
            questions, responses, and visibility.
          </p>
        </div>
        <button
          className="hero-add-btn"
          onClick={() => navigate("/faculty/practical-exams/add")}
        >
          <i className="bi bi-plus-circle"></i>
          Create Practical Exam
        </button>
      </div>

      <div className="summary-strip">
        <div className="mp-summary-tile">
          <span>Total Exams</span>
          <strong>{totalExams}</strong>
        </div>
        <div className="mp-summary-tile">
          <span>Visible to Students</span>
          <strong>{totalEnabled}</strong>
        </div>
        <div className="mp-summary-tile">
          <span>Filtered Results</span>
          <strong>{totalFiltered}</strong>
        </div>
      </div>

      <div className="filters-panel">
        <div className="mp-filter-group">
          <label htmlFor="search" className="mp-filter-label">
            Search by Title
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mp-filter-input"
          />
        </div>

        <div className="mp-filter-group">
          <label htmlFor="batch" className="mp-filter-label">
            Filter by Batch
          </label>
          <select
            id="batch"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="mp-filter-input"
          >
            <option value="">-- All Batches --</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>

        <div className="filters-actions">
          <button
            className="mp-secondary-btn"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
          <button
            className="mp-secondary-btn"
            onClick={() => setFilterBatch("")}
          >
            Reset Batch
          </button>
        </div>
      </div>

      {error && <div className="mp-alert mp-alert-danger">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No practical exams found</p>
          <button
            className="mp-primary-cta"
            onClick={() => navigate("/faculty/practical-exams/add")}
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="exam-grid">
          {filteredExams.map((exam) => (
            <article key={exam._id} className="exam-card">
              <header className="exam-card-head">
                <h3>{exam.title}</h3>
                <span
                  className={`mp-status-pill ${exam.isEnabled ? "enabled" : "disabled"}`}
                >
                  {exam.isEnabled ? "Visible" : "Hidden"}
                </span>
              </header>

              <div className="exam-meta-grid">
                <div>
                  <span className="mp-meta-label">Batch</span>
                  <p>{exam.batch || "General"}</p>
                </div>
                <div>
                  <span className="mp-meta-label">Divisions</span>
                  <p>{(exam.divisions || []).join(", ") || "-"}</p>
                </div>
                <div>
                  <span className="mp-meta-label">Marks</span>
                  <p>{exam.totalMarks}</p>
                </div>
                <div>
                  <span className="mp-meta-label">Duration</span>
                  <p>{exam.duration} min</p>
                </div>
                <div>
                  <span className="mp-meta-label">Created</span>
                  <p>{new Date(exam.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <div className="mp-exam-actions">
                <button
                  className="mp-action-btn mp-action-view"
                  onClick={() => handleViewQuestions(exam._id)}
                >
                  <i className="bi bi-list-check"></i>
                  View Questions
                </button>
                <button
                  className="mp-action-btn mp-action-responses"
                  onClick={() => handleViewResponses(exam._id)}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  View Responses
                </button>
                <button
                  className="mp-action-btn mp-action-edit"
                  onClick={() => handleEdit(exam._id)}
                >
                  <i className="bi bi-pencil-square"></i>
                  Edit Exam
                </button>
                {deleteConfirm === exam._id ? (
                  <div className="delete-confirm-wrap">
                    <button
                      className="mp-action-btn mp-action-delete-confirm"
                      onClick={() => handleDelete(exam._id)}
                    >
                      Confirm Delete
                    </button>
                    <button
                      className="mp-action-btn mp-action-cancel"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="mp-action-btn mp-action-delete"
                    onClick={() => handleDelete(exam._id)}
                  >
                    <i className="bi bi-trash"></i>
                    Delete Exam
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePractical;
