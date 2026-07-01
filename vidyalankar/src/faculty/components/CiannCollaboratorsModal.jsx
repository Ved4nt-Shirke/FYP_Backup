import React, { useEffect, useState } from "react";
import { CiaanUtils } from "../../utils/CiannUtils";

const CiaanCollaboratorsModal = ({ CiaanData, onClose, onUpdate }) => {
  const [activeSubTab, setActiveSubTab] = useState("collaborators"); // 'collaborators' or 'activity'
  const [collaborators, setCollaborators] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Direct sharing state
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyResults, setFacultyResults] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [sharePermission, setSharePermission] = useState("read");
  const [sharingLoading, setSharingLoading] = useState(false);

  const fetchCollaborators = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await CiaanUtils.getCiaanShares(CiaanData.CiaanId);
      setCollaborators(response.shares || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load collaborators");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await CiaanUtils.fetchCollaborationLogs(CiaanData.CiaanId);
      setActivityLogs(response.logs || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "collaborators") {
      fetchCollaborators();
    } else {
      fetchLogs();
    }
  }, [activeSubTab, CiaanData.CiaanId]);

  // Search faculty directory for direct sharing
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setFacultyResults([]);
        return;
      }
      try {
        const results = await CiaanUtils.fetchFacultyDirectory(searchQuery.trim());
        setFacultyResults(results?.faculty || []);
      } catch (err) {
        console.error("Error searching faculty:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleShareDirect = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) {
      setError("Please select a faculty member from the search results.");
      return;
    }

    setSharingLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const result = await CiaanUtils.shareCiaan(
        CiaanData.CiaanId,
        selectedFaculty.generatedUsername || selectedFaculty.username,
        sharePermission
      );
      setSuccessMsg(result.message || `Shared access successfully with ${selectedFaculty.name || selectedFaculty.username}`);
      setSelectedFaculty(null);
      setSearchQuery("");
      setFacultyResults([]);
      fetchCollaborators();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to share access");
    } finally {
      setSharingLoading(false);
    }
  };

  const handleUpdatePermission = async (userId, username, newPermission) => {
    setError("");
    setSuccessMsg("");
    try {
      const result = await CiaanUtils.shareCiaan(CiaanData.CiaanId, username, newPermission);
      setSuccessMsg(`Updated permission for ${username} to ${newPermission}`);
      fetchCollaborators();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update permission");
    }
  };

  const handleRevokeAccess = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${username}?`)) return;

    setError("");
    setSuccessMsg("");
    try {
      await CiaanUtils.removeCiaanShare(CiaanData.CiaanId, userId);
      setSuccessMsg(`Revoked access for ${username}`);
      fetchCollaborators();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to revoke access");
    }
  };

  return (
    <div className="Ciaan-modal-backdrop" onClick={onClose}>
      <div className="Ciaan-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="Ciaan-modal-content">
          {/* Header */}
          <div className="modal-header bg-dark text-white border-0 py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
            <div>
              <h5 className="modal-title fw-bold mb-0">
                <i className="bi bi-people-fill me-2 text-info"></i>
                Ciaan Collaboration Panel
              </h5>
              <small className="text-light opacity-75">
                Ciaan ID: {CiaanData.CiaanId} | Subject: {CiaanData.subject?.name} ({CiaanData.subject?.code})
              </small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="bg-light border-bottom px-4 py-2">
            <ul className="nav nav-pills card-header-pills">
              <li className="nav-item">
                <button
                  className={`nav-link px-4 py-2 fw-semibold rounded-pill border-0 ${activeSubTab === "collaborators" ? "active bg-info text-white" : "text-dark"}`}
                  onClick={() => setActiveSubTab("collaborators")}
                >
                  <i className="bi bi-person-gear me-1"></i> Collaborators
                </button>
              </li>
              <li className="nav-item ms-2">
                <button
                  className={`nav-link px-4 py-2 fw-semibold rounded-pill border-0 ${activeSubTab === "activity" ? "active bg-info text-white" : "text-dark"}`}
                  onClick={() => setActiveSubTab("activity")}
                >
                  <i className="bi bi-clock-history me-1"></i> Activity History
                </button>
              </li>
            </ul>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                <button type="button" className="btn-close" onClick={() => setError("")}></button>
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
                <button type="button" className="btn-close" onClick={() => setSuccessMsg("")}></button>
              </div>
            )}

            {activeSubTab === "collaborators" && (
              <div className="collaborators-tab">
                {/* Direct Share Form */}
                <div className="card border-0 bg-light p-3 mb-4 rounded-3">
                  <h6 className="fw-bold mb-3 text-dark">
                    <i className="bi bi-plus-circle-fill text-info me-1"></i>
                    Add Collaborator Directly
                  </h6>
                  <form onSubmit={handleShareDirect} className="row g-2 align-items-center">
                    <div className="col-md-6 position-relative">
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search faculty by name, ID, or dept..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* Dropdown Suggestions */}
                      {facultyResults.length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1 z-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {facultyResults.map((fac) => (
                            <button
                              key={fac._id || fac.generatedUsername}
                              type="button"
                              className="dropdown-item py-2 border-bottom text-start"
                              onClick={() => {
                                setSelectedFaculty(fac);
                                setSearchQuery(fac.fullName || fac.name || fac.username || "");
                                setFacultyResults([]);
                              }}
                            >
                              <div className="fw-semibold text-dark">{fac.fullName || fac.name}</div>
                              <small className="text-muted">
                                ID: {fac.employeeId || "N/A"} | Dept: {fac.departmentName || fac.department?.name || "N/A"}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={sharePermission}
                        onChange={(e) => setSharePermission(e.target.value)}
                      >
                        <option value="read">View Only (Read)</option>
                        <option value="edit">Can Edit (Collaborator)</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <button
                        type="submit"
                        className="btn btn-info w-100 text-white fw-semibold"
                        disabled={sharingLoading || !selectedFaculty}
                      >
                        {sharingLoading ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="bi bi-share me-1"></i>
                        )}
                        Share Access
                      </button>
                    </div>
                  </form>
                  {selectedFaculty && (
                    <div className="mt-2 text-info small">
                      Selected: <strong>{selectedFaculty.fullName || selectedFaculty.name}</strong> ({selectedFaculty.generatedUsername || selectedFaculty.username})
                    </div>
                  )}
                </div>

                {/* Collaborators List */}
                <h6 className="fw-bold mb-3 text-secondary">Current Collaborators</h6>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-info"></div>
                    <p className="text-muted mt-2">Loading collaborators...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>College</th>
                          <th>Permission</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Primary Owner */}
                        <tr>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
                                <i className="bi bi-person-check-fill"></i>
                              </div>
                              <div>
                                <span className="fw-bold text-dark">{CiaanData.ownerUsername || CiaanData.owner?.username}</span>
                                <span className="badge bg-success ms-2">Primary Owner</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="text-capitalize text-muted">{CiaanData.ownerRole || CiaanData.owner?.role || "Faculty"}</span></td>
                          <td><span className="text-muted">{CiaanData.college || "N/A"}</span></td>
                          <td><span className="badge bg-primary">Full Access</span></td>
                          <td className="text-end"><span className="text-muted small italic">Creator</span></td>
                        </tr>

                        {/* Other Collaborators */}
                        {collaborators.length > 0 ? (
                          collaborators.map((col) => (
                            <tr key={col.userId}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="bg-info text-white rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: "32px", height: "32px", fontSize: "14px" }}>
                                    <i className="bi bi-person-fill"></i>
                                  </div>
                                  <span className="fw-semibold text-dark">{col.username}</span>
                                </div>
                              </td>
                              <td><span className="text-capitalize text-muted">{col.role || "Faculty"}</span></td>
                              <td><span className="text-muted">{col.college || "N/A"}</span></td>
                              <td>
                                <select
                                  className={`form-select form-select-sm border-0 fw-semibold ${col.permission === "edit" ? "text-danger bg-danger-subtle" : "text-primary bg-primary-subtle"}`}
                                  value={col.permission}
                                  onChange={(e) => handleUpdatePermission(col.userId, col.username, e.target.value)}
                                  style={{ width: "120px", borderRadius: "8px" }}
                                >
                                  <option value="read">View Only</option>
                                  <option value="edit">Can Edit</option>
                                </select>
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                  title="Revoke Access"
                                  onClick={() => handleRevokeAccess(col.userId, col.username)}
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-3 text-muted">
                              <i className="bi bi-people me-2"></i> No active collaborators shared.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === "activity" && (
              <div className="activity-tab">
                <h6 className="fw-bold mb-3 text-secondary">
                  <i className="bi bi-list-task text-info me-1"></i>
                  Workspace Activity History
                </h6>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-info"></div>
                    <p className="text-muted mt-2">Loading logs...</p>
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="activity-timeline border-start ps-3 ms-2 position-relative" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {activityLogs.map((log, index) => (
                      <div key={log._id || index} className="mb-3 position-relative activity-item">
                        {/* Timeline Node */}
                        <div className="position-absolute bg-info text-white rounded-circle d-flex justify-content-center align-items-center shadow-sm" style={{ width: "24px", height: "24px", left: "-26px", top: "2px", fontSize: "10px" }}>
                          <i className="bi bi-activity"></i>
                        </div>
                        <div className="card border-0 bg-light p-3 rounded-3 shadow-sm">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <span className="fw-bold text-dark small">{log.username}</span>
                            <span className="text-muted small" style={{ fontSize: "11px" }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-muted small mb-1">
                            Action: <strong className="text-dark">{log.action}</strong> | Section: <strong className="text-info">{log.section}</strong>
                          </div>
                          <div className="text-dark small border-start border-3 border-info ps-2 mt-1">
                            {log.details}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-info-circle me-2"></i> No edits recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 py-3 bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
            <button type="button" className="btn btn-outline-secondary px-4 fw-semibold rounded-pill" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CiaanCollaboratorsModal;
