import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./ViewFaculty.css";

const ViewFaculty = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [branches, setBranches] = useState([]);
  const token = localStorage.getItem("token");

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return; // prevent duplicate fetches in StrictMode
    didInitRef.current = true;
    fetchFaculty();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch(config.admin.branches, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await fetch(config.admin.listFaculty, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFaculty(data.faculty);
      } else {
        setError(data.message || "Failed to load faculty");
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setError("Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch =
      f.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch =
      filterBranch === "all" || (f.branch && f.branch._id === filterBranch);
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="scrollable-wrapper view-faculty-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate("/admin-dashboard")}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="page-titles">
          <h1 className="page-title">Faculty Members</h1>
          <p className="page-subtitle">Manage all faculty members in your institution</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")} type="button">
            ×
          </button>
        </div>
      )}

      <div className="controls-section">
        <div className="search-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin-dashboard")}
        >
          <i className="fas fa-user-plus"></i> Create Faculty
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i> Loading faculty members...
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-users"></i>
          </div>
          <h3>{faculty.length === 0 ? "No Faculty Members Yet" : "No Matching Faculty Found"}</h3>
          <p>
            {faculty.length === 0
              ? "Create your first faculty member to get started with your institution"
              : "Try adjusting your search or filter criteria to find faculty"}
          </p>
          {faculty.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin-dashboard")}
            >
              <i className="fas fa-user-plus"></i> Create Faculty
            </button>
          )}
        </div>
      ) : (
        <div className="faculty-table-wrapper">
          <div className="faculty-stats">
            <span>{filteredFaculty.length} faculty member(s)</span>
          </div>

          <table className="faculty-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Branch</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((f) => (
                <tr key={f._id}>
                  <td>
                    <div className="faculty-name">
                      <div className="avatar">
                        {f.fullName?.charAt(0).toUpperCase() || f.username.charAt(0)}
                      </div>
                      <div>
                        <div className="name">{f.fullName || "N/A"}</div>
                        <div className="username">{f.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="username-code">{f.username}</code>
                  </td>
                  <td>
                    <span className="branch-badge">
                      {f.branch?.code || "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className="created-date">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-edit"
                        title="Edit faculty"
                        disabled
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        title="Delete faculty"
                        disabled
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewFaculty;
