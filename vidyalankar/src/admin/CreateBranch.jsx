import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./CreateBranch.css";

const CreateBranch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Branch name and code are required");
      setLoading(false);
      return;
    }

    if (formData.code.length < 2) {
      setError("Branch code must be at least 2 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(config.admin.createBranch, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setError("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }

      if (response.ok && data.success) {
        setSuccess("Branch created successfully!");
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 1500);
      } else {
        setError(data.message || "Failed to create branch");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scrollable-wrapper create-branch-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="page-titles">
          <h1 className="page-title">Create New Branch</h1>
          <p className="page-subtitle">Add a branch to your institution</p>
        </div>
      </div>

      <div className="form-container">
        <div className="form-card">
          <div className="form-header">
            <div className="header-icon">
              <i className="fas fa-code-branch"></i>
            </div>
            <div>
              <h2>Branch Information</h2>
              <p>Create a new branch for organizing your faculty</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form-body">
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <button className="alert-close" onClick={() => setError("")} type="button">
                  ×
                </button>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <span>{success}</span>
                <button className="alert-close" onClick={() => setSuccess("")} type="button">
                  ×
                </button>
              </div>
            )}

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Branch Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="e.g., Computer Science Engineering"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <small className="form-hint">The full name of the branch</small>
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Branch Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  className="form-input"
                  placeholder="e.g., CSE"
                  maxLength="10"
                  value={formData.code.toUpperCase()}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                />
                <small className="form-hint">
                  2-10 character code (e.g., CSE, IT, ECE, ME)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description <span className="optional">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Add any additional details about the branch"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
                <small className="form-hint">Provide more context about this branch</small>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> Create Branch
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="form-help">
            <div className="help-section">
              <h4>
                <i className="fas fa-lightbulb"></i> Tips for Branch Creation
              </h4>
              <ul className="tips-list">
                <li>Use clear, descriptive branch names</li>
                <li>Keep branch codes short and memorable (CSE, IT, ECE, ME)</li>
                <li>Branch codes are automatically converted to uppercase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBranch;
