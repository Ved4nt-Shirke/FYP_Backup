import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";
import "./ViewInstitutions.css";

const ViewInstitutions = () => {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  // Refetch when navigating back to this page within the SPA
  useEffect(() => {
    fetchInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Also refresh on window focus to avoid stale data
  useEffect(() => {
    const onFocus = () => fetchInstitutions();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = institutions.filter(
        (institution) =>
          (institution.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (institution.code || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (institution.adminUsername || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
      setFilteredInstitutions(filtered);
    } else {
      setFilteredInstitutions(institutions);
    }
  }, [searchTerm, institutions]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get("/superadmin/institutions");

      if (response.data.success) {
        setInstitutions(response.data.institutions || []);
      } else {
        setError("Failed to fetch institutions");
      }
    } catch (err) {
      console.error("Error fetching institutions:", err);
      setError(
        "Error fetching institutions: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInstitutions();
  };

  const handleNavigate = (id) => {
    navigate(`/superadmin-manage-institution/${id}`);
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const renderPaletteTag = (institution) => {
    const primary = institution?.palette?.colors?.primary;
    const name = institution?.palette?.name ?? (primary ? "custom" : "default");
    if (!primary) return null;
    return (
      <span className="meta-pill palette-pill" title={`Palette: ${name}`}>
        <span className="palette-dot" style={{ background: primary }} />
        {name}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="institutions-container">
        <div className="institutions-header">
          <h2>View Institutions</h2>
          <p className="muted">Loading institutions...</p>
        </div>
        <div className="card neutral-card">
          <div className="card-body">
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="institutions-container">
      <div className="institutions-header">
        <h2>View Institutions</h2>
        <p className="muted">Click on an institution to manage it</p>
      </div>

      <div className="search-refresh-container">
        <div className="search-input-group">
          <span className="search-icon">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search name, code or admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="btn-clear"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="btn-row">
          <a href="/superadmin-create-institution" className="create-btn">
            <i className="fas fa-plus-circle me-2"></i>Create New
          </a>
          <button className="refresh-btn" onClick={handleRefresh}>
            <i className="fas fa-sync-alt me-2"></i>Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {filteredInstitutions.length === 0 ? (
        <div className="card neutral-card">
          <div className="card-body empty-state">
            <i className="fas fa-university empty-icon"></i>
            <h5>No institutions found</h5>
            <p className="muted">
              {searchTerm
                ? `No institutions match "${searchTerm}".`
                : "Create your first institution to get started."}
            </p>
          </div>
        </div>
      ) : (
        <div className="institutions-list">
          {filteredInstitutions.map((institution) => (
            <div
              key={institution._id}
              className="institution-item"
              onClick={() => handleNavigate(institution._id)}
            >
              <div className="card-body">
                <div className="institution-logo">
                  <div className="logo-circle">
                    {getInitials(institution.name)}
                  </div>
                </div>

                <div className="flex-grow-1 ms-3">
                  <div className="institution-name">{institution.name}</div>
                  <div className="institution-meta">
                    <span className="meta-pill">
                      Code: {institution.code || "—"}
                    </span>
                    <span className="meta-pill">
                      Admin: {institution.adminUsername || "—"}
                    </span>
                    {renderPaletteTag(institution)}
                  </div>
                </div>

                <div className="chev">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewInstitutions;
