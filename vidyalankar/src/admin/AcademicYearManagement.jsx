import React, { useState, useEffect } from "react";
import config from "../config/api";
import "./AcademicYearManagement.css";

const AcademicYearManagement = () => {
  // State variables
  const [academicYears, setAcademicYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    yearName: "",
    schemeSelection: "K Scheme",
    customScheme: "",
    startDate: "",
    endDate: "",
  });

  // Selected Year Stats State
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [selectedYearStats, setSelectedYearStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsTab, setStatsTab] = useState("faculty"); // faculty, department, subject, semester

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: "", // "complete" or "activate"
    yearId: null,
    yearName: "",
  });

  // Fetch all academic years and current active year
  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      // 1. Fetch current active year
      const activeRes = await fetch(config.academicYear.current, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeData = await activeRes.json();
      if (activeData.success) {
        setActiveYear(activeData.academicYear);
        if (activeData.academicYear && !selectedYearId) {
          setSelectedYearId(activeData.academicYear._id);
        }
      }

      // 2. Fetch all years
      const allRes = await fetch(config.academicYear.all, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allData = await allRes.json();
      if (allData.success) {
        setAcademicYears(allData.academicYears);
        if (allData.academicYears.length > 0 && !selectedYearId && !activeData.academicYear) {
          setSelectedYearId(allData.academicYears[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching academic year data:", err);
      setError("Failed to load academic year data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch stats when selected year changes
  useEffect(() => {
    if (!selectedYearId) return;

    const fetchYearStats = async () => {
      setLoadingStats(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(config.academicYear.stats(selectedYearId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setSelectedYearStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchYearStats();
  }, [selectedYearId]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit Create Year Form
  const handleCreateYearSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    // Scheme logic: if Other Scheme is chosen, use custom text input
    const finalScheme =
      formData.schemeSelection === "Other Scheme"
        ? formData.customScheme.trim()
        : formData.schemeSelection;

    if (!finalScheme) {
      setError("Please specify a scheme.");
      return;
    }

    const payload = {
      yearName: formData.yearName.trim(),
      scheme: finalScheme,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    try {
      const res = await fetch(config.academicYear.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Academic Year "${data.academicYear.yearName}" successfully created and activated!`);
        setShowCreateModal(false);
        // Reset form
        setFormData({
          yearName: "",
          schemeSelection: "K Scheme",
          customScheme: "",
          startDate: "",
          endDate: "",
        });
        setSelectedYearId(data.academicYear._id);
        fetchData();
      } else {
        setError(data.message || "Failed to create academic year.");
      }
    } catch (err) {
      setError("Network error. Failed to create academic year.");
      console.error(err);
    }
  };

  // Handle Activation/Completion Actions
  const handleYearActionConfirm = async () => {
    const { type, yearId } = confirmDialog;
    setConfirmDialog({ show: false, type: "", yearId: null, yearName: "" });
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");

    const endpoint =
      type === "complete"
        ? config.academicYear.complete(yearId)
        : config.academicYear.activate(yearId);

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchData();
      } else {
        setError(data.message || `Action failed.`);
      }
    } catch (err) {
      setError("Network error during action completion.");
      console.error(err);
    }
  };

  const openConfirmDialog = (type, year) => {
    setConfirmDialog({
      show: true,
      type,
      yearId: year._id,
      yearName: year.yearName,
    });
  };

  // Helper date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="scrollable-wrapper">
        <div className="loading-container">
          <div className="ay-spinner"></div>
          <p>Loading Academic Year Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollable-wrapper admin-page">
      <div className="academic-year-management">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h2>Academic Year Management</h2>
            <p>Configure academic years, schemes, and track CIANN progress across your institution</p>
          </div>
          <div className="ay-header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-calendar-plus" style={{ marginRight: "8px" }}></i>
              Create Academic Year
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="alert alert-danger" style={{ display: "flex", justifyContent: "space-between" }}>
            <span><i className="bi bi-exclamation-triangle-fill" style={{ marginRight: "8px" }}></i>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between" }}>
            <span><i className="bi bi-check-circle-fill" style={{ marginRight: "8px" }}></i>{success}</span>
            <button onClick={() => setSuccess("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Current Active Year Hero banner */}
        {activeYear ? (
          <div className="active-year-hero">
            <div className="active-year-info">
              <h3>Currently Active Academic Year</h3>
              <p className="active-year-name">{activeYear.yearName}</p>
              <div className="active-year-details">
                <div className="active-detail-item">
                  <span className="active-detail-label">Scheme Selection</span>
                  <span className="active-detail-value">{activeYear.scheme}</span>
                </div>
                <div className="active-detail-item">
                  <span className="active-detail-label">Start Date</span>
                  <span className="active-detail-value">{formatDate(activeYear.startDate)}</span>
                </div>
                <div className="active-detail-item">
                  <span className="active-detail-label">End Date</span>
                  <span className="active-detail-value">{formatDate(activeYear.endDate)}</span>
                </div>
              </div>
            </div>
            <div className="active-year-actions">
              <button
                className="btn btn-danger"
                onClick={() => openConfirmDialog("complete", activeYear)}
              >
                <i className="bi bi-archive-fill" style={{ marginRight: "8px" }}></i>
                Complete & Archive Year
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "#f59e0b" }}>
            <div className="empty-state-icon" style={{ color: "#f59e0b" }}>
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3>No Active Academic Year Configured</h3>
            <p>
              There is currently no active academic year configured for your college.
              Please create or activate one below to enable automatic tracking.
            </p>
          </div>
        )}

        {/* Academic Years Timeline / List */}
        <div className="years-timeline-section card">
          <h3 className="section-title">
            <i className="bi bi-list-stars" style={{ color: "var(--admin-primary)" }}></i>
            Academic Years List
          </h3>

          {academicYears.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h3>No Academic Years Found</h3>
              <p>Create an academic year to start configuring your institution terms.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Academic Year Name</th>
                    <th>Scheme</th>
                    <th>Date Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {academicYears.map((year) => {
                    const isActive = year.status === "active";
                    const isSelected = selectedYearId === year._id;

                    return (
                      <tr
                        key={year._id}
                        className={isSelected ? "selected-row" : ""}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedYearId(year._id)}
                      >
                        <td>
                          <strong>{year.yearName}</strong>
                          {isActive && <span style={{ marginLeft: "8px", verticalAlign: "middle" }} className="ay-badge ay-badge-active">Current</span>}
                        </td>
                        <td>{year.scheme}</td>
                        <td>
                          {formatDate(year.startDate)} to {formatDate(year.endDate)}
                        </td>
                        <td>
                          <span className={`ay-badge ${isActive ? "ay-badge-active" : "ay-badge-completed"}`}>
                            {year.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedYearId(year._id)}
                            >
                              <i className="bi bi-bar-chart-fill" style={{ marginRight: "4px" }}></i>
                              Stats
                            </button>
                            {!isActive && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => openConfirmDialog("activate", year)}
                              >
                                <i className="bi bi-play-fill" style={{ marginRight: "4px" }}></i>
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Year Stats & Performance Section */}
        {selectedYearId && (
          <div className="analytics-section">
            <div className="analytics-header">
              <div>
                <h3 className="section-title" style={{ fontSize: "1.3rem" }}>
                  <i className="bi bi-graph-up-arrow" style={{ color: "var(--admin-primary)" }}></i>
                  Analytics & tracking - {selectedYearStats?.yearName || "Year Details"}
                </h3>
                <p style={{ margin: "4px 0 0 0", color: "var(--admin-text-secondary)", fontSize: "0.85rem" }}>
                  Scheme: {selectedYearStats?.scheme || "-"} | Status: <span style={{ textTransform: "capitalize" }}>{selectedYearStats?.status || "-"}</span>
                </p>
              </div>

              <div className="analytics-tabs">
                <button
                  className={`analytics-tab-btn ${statsTab === "faculty" ? "active" : ""}`}
                  onClick={() => setStatsTab("faculty")}
                >
                  <i className="bi bi-people" style={{ marginRight: "6px" }}></i>
                  Faculty Wise
                </button>
                <button
                  className={`analytics-tab-btn ${statsTab === "department" ? "active" : ""}`}
                  onClick={() => setStatsTab("department")}
                >
                  <i className="bi bi-building" style={{ marginRight: "6px" }}></i>
                  Departments
                </button>
                <button
                  className={`analytics-tab-btn ${statsTab === "subject" ? "active" : ""}`}
                  onClick={() => setStatsTab("subject")}
                >
                  <i className="bi bi-journal-bookmark" style={{ marginRight: "6px" }}></i>
                  Subjects
                </button>
                <button
                  className={`analytics-tab-btn ${statsTab === "semester" ? "active" : ""}`}
                  onClick={() => setStatsTab("semester")}
                >
                  <i className="bi bi-bezier2" style={{ marginRight: "6px" }}></i>
                  Semesters
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px" }}>
                <div className="ay-spinner"></div>
                <p>Loading year statistics...</p>
              </div>
            ) : selectedYearStats ? (
              <div>
                {/* Stats cards row */}
                <div className="ay-stats-grid mb-xl">
                  <div className="ay-stat-card">
                    <div className="ay-stat-icon">
                      <i className="bi bi-file-earmark-medical"></i>
                    </div>
                    <div className="ay-stat-info">
                      <span className="ay-stat-value">{selectedYearStats.stats.totalCianns}</span>
                      <span className="ay-stat-label">Total CIANNs</span>
                    </div>
                  </div>

                  <div className="ay-stat-card">
                    <div className="ay-stat-icon">
                      <i className="bi bi-check2-circle"></i>
                    </div>
                    <div className="ay-stat-info">
                      <span className="ay-stat-value">{selectedYearStats.stats.completedCianns}</span>
                      <span className="ay-stat-label">Completed</span>
                    </div>
                  </div>

                  <div className="ay-stat-card">
                    <div className="ay-stat-icon warning-theme">
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <div className="ay-stat-info">
                      <span className="ay-stat-value">
                        {selectedYearStats.stats.activeCianns + selectedYearStats.stats.archivedCianns}
                      </span>
                      <span className="ay-stat-label">In Progress</span>
                    </div>
                  </div>

                  <div className="ay-stat-card">
                    <div className="ay-stat-icon info-theme">
                      <i className="bi bi-percent"></i>
                    </div>
                    <div className="ay-stat-info" style={{ width: "100%" }}>
                      <span className="ay-stat-value">{selectedYearStats.stats.completionPercentage}%</span>
                      <span className="ay-stat-label">Completion Progress</span>
                      <div className="ay-progress-container">
                        <div
                          className="ay-progress-bar"
                          style={{ width: `${selectedYearStats.stats.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Tab: Faculty Wise */}
                {statsTab === "faculty" && (
                  <div className="table-wrapper">
                    {selectedYearStats.stats.facultyStats.length === 0 ? (
                      <p className="no-items-text">No CIANNs created under this academic year yet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Faculty Username / ID</th>
                            <th>Total CIANNs Assigned</th>
                            <th>Completed CIANNs</th>
                            <th>Active / Pending CIANNs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedYearStats.stats.facultyStats.map((f, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong>{f.facultyName}</strong>
                              </td>
                              <td>{f.total}</td>
                              <td>
                                <span className="ay-badge ay-badge-active" style={{ fontSize: "0.75rem" }}>
                                  {f.completed} Completed
                                </span>
                              </td>
                              <td>
                                <span className="ay-badge ay-badge-completed" style={{ fontSize: "0.75rem" }}>
                                  {f.active + f.archived} In Progress
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Sub Tab: Department breakdown */}
                {statsTab === "department" && (
                  <div className="table-wrapper">
                    {selectedYearStats.stats.departmentStats.length === 0 ? (
                      <p className="no-items-text">No CIANNs mapped to any department yet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Total CIANNs</th>
                            <th>Completed</th>
                            <th>Pending / Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedYearStats.stats.departmentStats.map((d, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong>{d.department}</strong>
                              </td>
                              <td>{d.total}</td>
                              <td>{d.completed}</td>
                              <td>{d.pending}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Sub Tab: Subject breakdown */}
                {statsTab === "subject" && (
                  <div className="table-wrapper">
                    {selectedYearStats.stats.subjectStats.length === 0 ? (
                      <p className="no-items-text">No subjects linked to CIANNs yet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Subject Name</th>
                            <th>Total CIANNs</th>
                            <th>Completed</th>
                            <th>Pending / Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedYearStats.stats.subjectStats.map((s, idx) => (
                            <tr key={idx}>
                              <td>{s.subject}</td>
                              <td>{s.total}</td>
                              <td>{s.completed}</td>
                              <td>{s.pending}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Sub Tab: Semester breakdown */}
                {statsTab === "semester" && (
                  <div className="table-wrapper">
                    {selectedYearStats.stats.semesterStats.length === 0 ? (
                      <p className="no-items-text">No semester info mapped to CIANNs yet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Semester</th>
                            <th>Total CIANNs</th>
                            <th>Completed</th>
                            <th>Pending / Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedYearStats.stats.semesterStats.map((s, idx) => (
                            <tr key={idx}>
                              <td>Semester {s.semester}</td>
                              <td>{s.total}</td>
                              <td>{s.completed}</td>
                              <td>{s.pending}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="no-items-text">Failed to fetch stats for this academic year.</p>
            )}
          </div>
        )}

        {/* ─────────────── MODALS ─────────────── */}

        {/* Create Year Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: "550px" }}>
              <div className="modal-header">
                <h3>Create New Academic Year</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateYearSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="yearName">Academic Year Name</label>
                    <input
                      type="text"
                      id="yearName"
                      name="yearName"
                      placeholder="e.g. 2025-26, 2026-27"
                      required
                      value={formData.yearName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Scheme Selection</label>
                    <div className="inline-radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="schemeSelection"
                          value="K Scheme"
                          checked={formData.schemeSelection === "K Scheme"}
                          onChange={handleInputChange}
                        />
                        K Scheme
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="schemeSelection"
                          value="I Scheme"
                          checked={formData.schemeSelection === "I Scheme"}
                          onChange={handleInputChange}
                        />
                        I Scheme
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="schemeSelection"
                          value="Other Scheme"
                          checked={formData.schemeSelection === "Other Scheme"}
                          onChange={handleInputChange}
                        />
                        Custom Scheme
                      </label>
                    </div>

                    {formData.schemeSelection === "Other Scheme" && (
                      <input
                        type="text"
                        name="customScheme"
                        className="custom-scheme-input"
                        placeholder="Enter Scheme Name (e.g. O Scheme)"
                        required
                        value={formData.customScheme}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label htmlFor="startDate">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        required
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create & Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmDialog.show && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: "450px" }}>
              <div className="modal-header">
                <h3>Confirm Action</h3>
                <button
                  onClick={() => setConfirmDialog({ show: false, type: "", yearId: null, yearName: "" })}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {confirmDialog.type === "complete" ? (
                  <p>
                    Are you sure you want to mark academic year <strong>{confirmDialog.yearName}</strong> as Completed?
                    <br />
                    <br />
                    <span style={{ color: "var(--admin-danger)", fontWeight: "600" }}>
                      WARNING: This action makes all CIANNs associated with this year READ-ONLY. Faculty will not be able to edit their logbooks, attendance, or planning sheets.
                    </span>
                  </p>
                ) : (
                  <p>
                    Are you sure you want to activate academic year <strong>{confirmDialog.yearName}</strong>?
                    <br />
                    <br />
                    <span>
                      If there is another currently active year, it will automatically be marked as Completed/Archived.
                    </span>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmDialog({ show: false, type: "", yearId: null, yearName: "" })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${confirmDialog.type === "complete" ? "btn-danger" : "btn-primary"}`}
                  onClick={handleYearActionConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearManagement;
