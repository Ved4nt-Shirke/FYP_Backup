import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./AdminPanel.css";

const CreateOfficeStaff = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      setIsAdmin(true);
    } else {
      setError("Access denied. Admins only.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    }
  }, [navigate]);

  useEffect(() => {
    if (adminInstitution) {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminInstitution]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      setDepartments(response.data.departments || []);
      setDepartment("");
    } catch (err) {
      console.error("Error fetching departments:", err);
      if (err.response?.status === 401) {
        showErrorAlert("Authentication failed. Please log in again.");
        navigate("/");
      } else if (err.response?.status === 403) {
        showErrorAlert("Access denied. Admin privileges required.");
        navigate("/dashboard");
      } else {
        showErrorAlert("Failed to load departments. Please try again.");
      }
      setDepartments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedUser(null);

    try {
      const payload = {
        fullName,
        email,
        institution: adminInstitution,
        department: department || null,
      };

      const response = await axios.post(config.admin.officeStaff, payload);

      if (response.data.success) {
        // Handle both response formats
        const username = response.data.username || response.data.loginCredentials?.username;
        const password = response.data.password || response.data.loginCredentials?.password;
        
        setCreatedUser({
          username,
          password,
        });
        showSuccessAlert(response.data.message);
        // Reset form
        setFullName("");
        setEmail("");
        setDepartment("");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error creating office staff user:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create office staff user";
      showErrorAlert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel-layout">
        <div className="panel-card">
          <div className="panel-body" style={{ textAlign: "center" }}>
            <p
              style={{
                color: "#dc2626",
                fontWeight: "600",
                fontSize: "1.05rem",
              }}
            >
              ⚠️ Access Denied
            </p>
            <p>
              You do not have permission to access this page. Only
              administrators can access the admin panel.
            </p>
            <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-layout">
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-titles">
            <h1 className="panel-title">Create Office Staff</h1>
            <p className="panel-subtitle">
              Create new office staff account for {adminInstitution}
            </p>
          </div>
          <div className="panel-actions">
            <button
              className="btn-secondary-ghost"
              onClick={() => navigate("/admin-dashboard")}
              title="Go back to dashboard"
            >
              <i className="bi bi-house-door"></i> Dashboard
            </button>
          </div>
        </div>

        <div className="panel-body">
          {error && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.05)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                color: "#991b1b",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-vertical">
            <div className="form-row">
              <div className="form-field col">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Enter office staff full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-field col">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter office staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field col">
                <label htmlFor="institution">Institution *</label>
                <input
                  type="text"
                  id="institution"
                  value={adminInstitution}
                  readOnly
                  disabled
                />
                <p className="field-hint">This is your assigned institution</p>
              </div>

              <div className="form-field col">
                <label htmlFor="department">Department (Optional)</label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading || departments.length === 0}
                >
                  <option value="">Select a department (Optional)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p className="field-hint">
                    No departments available. You can create a user without a department.
                  </p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFullName("");
                  setEmail("");
                  setDepartment("");
                }}
                disabled={loading}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !fullName || !email}
              >
                {loading ? (
                  <>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus"></i>
                    Create Office Staff Account
                  </>
                )}
              </button>
            </div>
          </form>

          {createdUser && (
            <div className="success-card">
              <h3>✓ Office Staff Account Created Successfully!</h3>
              <p>Share these credentials with the office staff member:</p>
              <div className="credentials">
                <div className="credentials-item">
                  <span className="credentials-label">Username:</span>
                  <span className="credentials-value">
                    {createdUser.username}
                  </span>
                </div>
                <div className="credentials-item">
                  <span className="credentials-label">Password:</span>
                  <span className="credentials-value">
                    {createdUser.password}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginTop: "12px",
                }}
              >
                ⚠️ Make sure to save these credentials. The password cannot be
                retrieved later.
              </p>
              <div style={{ marginTop: "16px" }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/admin-office-staff")}
                >
                  View All Office Staff
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOfficeStaff;

