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
        }
      );

      const data = await response.json();

      if (data.success) {
        setPracticalExams((prev) =>
          prev.filter((exam) => exam._id !== examId)
        );
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
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="page-header">
        <h1 className="page-title">Manage Practical Exams</h1>
        <p className="page-subtitle">
          View, edit, and manage your practical exams
        </p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="search" className="filter-label">
            Search by Title
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

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

        <button
          className="btn btn-primary btn-add"
          onClick={() => navigate("/faculty/practical-exams/add")}
        >
          <i className="bi bi-plus-circle"></i> Add New Exam
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No practical exams found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/faculty/practical-exams/add")}
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="exams-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Batch</th>
                <th>Divisions</th>
                <th>Marks</th>
                <th>Duration</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map((exam) => (
                <tr key={exam._id}>
                  <td className="title-cell">{exam.title}</td>
                  <td>{exam.batch}</td>
                  <td>
                    <span className="divisions-badge">
                      {exam.divisions.length} division(s)
                    </span>
                  </td>
                  <td>{exam.totalMarks}</td>
                  <td>{exam.duration} min</td>
                  <td>
                    {new Date(exam.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-view"
                      title="View Questions"
                      onClick={() => handleViewQuestions(exam._id)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn-icon btn-responses"
                      title="View Responses"
                      onClick={() => handleViewResponses(exam._id)}
                    >
                      <i className="bi bi-file-earmark-text"></i>
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      title="Edit"
                      onClick={() => handleEdit(exam._id)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      title="Delete"
                      onClick={() => handleDelete(exam._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this practical exam?</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePractical;
