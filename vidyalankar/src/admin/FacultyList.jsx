import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./FacultyList.css";

const FacultyList = ({ filterRole = "faculty" }) => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [stats, setStats] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [editingUsername, setEditingUsername] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [editingPassword, setEditingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showFacultyDetailsModal, setShowFacultyDetailsModal] = useState(false);

  // Get admin's institution from localStorage
  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchFaculty();
    fetchDepartments();
    fetchStats();
  }, [navigate]);

  useEffect(() => {
    let filtered = faculty;
    if (searchTerm) {
      filtered = filtered.filter(
        (fac) =>
          fac.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fac.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fac.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fac.skills?.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }
    setFilteredFaculty(filtered);
  }, [faculty, searchTerm]);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get(`${config.admin.faculty}?role=${filterRole}`);
      if (response.data.success) {
        setFaculty(response.data.faculty);
      } else {
        showErrorAlert("Failed to fetch faculty");
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
      showErrorAlert("Failed to fetch faculty");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(config.admin.facultyStats);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching faculty stats:", err);
    }
  };

  const handleDeleteClick = (facultyMember) => {
    setFacultyToDelete(facultyMember);
    setAdminPassword("");
    setConfirmDeleteText("");
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!adminPassword.trim()) {
      showErrorAlert("Please enter your admin password");
      return;
    }
    if (confirmDeleteText.toUpperCase() !== "DELETE") {
      showErrorAlert("Please type DELETE to confirm");
      return;
    }
    try {
      const response = await axios.delete(
        config.admin.deleteFaculty(facultyToDelete._id),
        { data: { password: adminPassword } },
      );
      if (response.data.success) {
        showSuccessAlert(response.data.message);
        setFaculty(faculty.filter((fac) => fac._id !== facultyToDelete._id));
        setShowDeleteModal(false);
        setFacultyToDelete(null);
        setAdminPassword("");
        setConfirmDeleteText("");
        fetchStats();
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error deleting faculty:", err);
      showErrorAlert("Failed to delete faculty");
    }
  };

  const handleCreateFaculty = () => {
    if (filterRole === "hod") {
      navigate("/admin-create-hod");
    } else if (filterRole === "academic_coordinator") {
      navigate("/admin-create-academic-coordinator");
    } else {
      navigate("/admin-create-faculty");
    }
  };
  const handleEditFaculty = (facultyMember) =>
    navigate(`/admin-edit-faculty/${facultyMember._id}`, {
      state: { faculty: facultyMember },
    });
  const handleViewFaculty = (facultyMember) =>
    openFacultyDetailsModal(facultyMember);

  const openFacultyDetailsModal = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setShowFacultyDetailsModal(true);
  };
  const closeFacultyDetailsModal = () => {
    setShowFacultyDetailsModal(false);
    setSelectedFaculty(null);
  };
  const navigateToFacultyProfile = (facultyId) =>
    navigate(`/admin-edit-faculty/${facultyId}`);

  // Credential Management
  const openCredentialsModal = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setShowCredentialsModal(true);
  };
  const closeCredentialsModal = () => {
    setShowCredentialsModal(false);
    setSelectedFaculty(null);
    setEditingUsername(null);
    setNewUsername("");
    setEditingPassword(null);
    setNewPassword("");
  };
  const togglePasswordVisibility = (facultyId) => {
    setShowPassword((prev) => ({ ...prev, [facultyId]: !prev[facultyId] }));
  };
  const startEditingUsername = (facultyMember) => {
    setEditingUsername(facultyMember._id);
    setNewUsername(facultyMember.generatedUsername || "");
  };
  const cancelEditingUsername = () => {
    setEditingUsername(null);
    setNewUsername("");
  };
  const startEditingPassword = (facultyMember) => {
    setEditingPassword(facultyMember._id);
    setNewPassword(facultyMember.currentPassword || "");
  };
  const cancelEditingPassword = () => {
    setEditingPassword(null);
    setNewPassword("");
  };

  const updateUsername = async (facultyId) => {
    if (!newUsername.trim()) return showErrorAlert("Username cannot be empty");
    try {
      const response = await axios.put(
        config.admin.updateFacultyUsername(facultyId),
        {
          newUsername: newUsername.trim(),
        },
      );
      if (response.data.success) {
        showSuccessAlert("Username updated successfully!");
        setFaculty(
          faculty.map((fac) =>
            fac._id === facultyId
              ? { ...fac, generatedUsername: newUsername.trim() }
              : fac,
          ),
        );
        if (selectedFaculty && selectedFaculty._id === facultyId) {
          setSelectedFaculty({
            ...selectedFaculty,
            generatedUsername: newUsername.trim(),
          });
        }
        setEditingUsername(null);
        setNewUsername("");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      showErrorAlert("Failed to update username");
    }
  };

  const updatePassword = async (facultyId) => {
    if (!newPassword.trim()) return showErrorAlert("Password cannot be empty");
    if (newPassword.length < 6)
      return showErrorAlert("Password must be at least 6 characters");
    try {
      const response = await axios.put(
        config.admin.updateFacultyPassword(facultyId),
        {
          newPassword: newPassword.trim(),
        },
      );
      if (response.data.success) {
        showSuccessAlert("Password updated successfully!");
        setFaculty(
          faculty.map((fac) =>
            fac._id === facultyId
              ? { ...fac, currentPassword: newPassword.trim() }
              : fac,
          ),
        );
        if (selectedFaculty && selectedFaculty._id === facultyId) {
          setSelectedFaculty({
            ...selectedFaculty,
            currentPassword: newPassword.trim(),
          });
        }
        setEditingPassword(null);
        setNewPassword("");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      showErrorAlert("Failed to update password");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessAlert("Copied to clipboard!");
    } catch (err) {
      showErrorAlert("Failed to copy");
    }
  };

  const shareCredentials = (facultyMember) => {
    const credentials = `Faculty Login Credentials\nName: ${facultyMember.fullName}\nUsername: ${facultyMember.generatedUsername}\nPassword: ${facultyMember.currentPassword}\nPlease change your password after first login.`;
    copyToClipboard(credentials);
  };

  const getStatusBadge = (status) => {
    const statusClass =
      status === "inactive" ? "status-inactive" : "status-active";
    const icon = status === "inactive" ? "bi-x-circle" : "bi-check-circle";
    return (
      <span className={`status-badge ${statusClass}`}>
        <i className={`bi ${icon}`}></i> {status || "Active"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading {filterRole === "hod" ? "HODs" : filterRole === "academic_coordinator" ? "Coordinators" : "faculty"}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">{filteredFaculty.length}</div>
              <div className="stat-label">
                {filterRole === "hod"
                  ? "Total HODs"
                  : filterRole === "academic_coordinator"
                  ? "Total Coordinators"
                  : "Total Faculty"}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-person-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {filteredFaculty.filter((f) => f.status === "active").length}
              </div>
              <div className="stat-label">
                {filterRole === "hod"
                  ? "Active HODs"
                  : filterRole === "academic_coordinator"
                  ? "Active Coordinators"
                  : "Active Faculty"}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-building"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {stats.departmentsWithFaculty || 0}
              </div>
              <div className="stat-label">Departments</div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Controls */}
      <div className="faculty-controls">
        <div className="search-container">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder={`Search ${filterRole === "hod" ? "HOD" : filterRole === "academic_coordinator" ? "coordinator" : "faculty"} name, ID, email...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="control-buttons">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              <i className="bi bi-grid"></i>
            </button>
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <i className="bi bi-list-ul"></i>
            </button>
          </div>
          <button className="btn-primary" onClick={handleCreateFaculty}>
            <i className="bi bi-person-plus"></i>{" "}
            {filterRole === "hod"
              ? "Add HOD"
              : filterRole === "academic_coordinator"
              ? "Add Coordinator"
              : "Add Faculty"}
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredFaculty.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-people"></i>
          </div>
          <h3>
            {searchTerm
              ? "No matching records found"
              : filterRole === "hod"
              ? "No HODs Yet"
              : filterRole === "academic_coordinator"
              ? "No Academic Coordinators Yet"
              : "No Faculty Yet"}
          </h3>
          <p>
            {searchTerm
              ? "Try adjusting your search criteria."
              : `Get started by adding your first ${
                  filterRole === "hod"
                    ? "HOD"
                    : filterRole === "academic_coordinator"
                    ? "academic coordinator"
                    : "faculty member"
                }.`}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="faculty-grid">
          {filteredFaculty.map((member) => (
            <div
              key={member._id}
              className="faculty-card"
              onClick={() => openFacultyDetailsModal(member)}
            >
              <div className="faculty-header">
                <div className="faculty-avatar">
                  <i className="bi bi-person-circle"></i>
                </div>
                <div className="faculty-actions">
                  <button
                    className="action-btn credentials-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCredentialsModal(member);
                    }}
                    title="Credentials"
                  >
                    <i className="bi bi-key"></i>
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditFaculty(member);
                    }}
                    title="Edit"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(member);
                    }}
                    title="Delete"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div className="faculty-content">
                <h4 className="faculty-name">{member.fullName}</h4>
                <p className="faculty-employee-id">{member.employeeId}</p>
                <p className="faculty-email">
                  <i className="bi bi-envelope"></i> {member.email}
                </p>
                {getStatusBadge(member.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="faculty-table-container">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Username</th>
                <th>Password</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div className="table-faculty-info">
                      <div className="faculty-name-cell">{member.fullName}</div>
                      <div className="faculty-email-cell">{member.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className="username-badge">
                      {member.generatedUsername || "-"}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="username-badge"
                        style={{
                          background: "transparent",
                          border: "1px solid var(--border-color, #e5e7eb)",
                        }}
                      >
                        {showPassword[member._id]
                          ? member.currentPassword
                          : "••••••"}
                      </span>
                      <button
                        className="btn-small"
                        onClick={() => togglePasswordVisibility(member._id)}
                      >
                        <i
                          className={`bi bi-eye${
                            showPassword[member._id] ? "-slash" : ""
                          }`}
                        ></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="employee-id-badge">
                      {member.employeeId}
                    </span>
                  </td>
                  <td>{member.department?.name || "Not Assigned"}</td>
                  <td>{getStatusBadge(member.status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-small"
                        onClick={() => openCredentialsModal(member)}
                        title="Credentials"
                      >
                        <i className="bi bi-key"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => handleEditFaculty(member)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn-small"
                        style={{
                          color: "var(--danger-color, #ef4444)",
                          borderColor: "var(--danger-color, #ef4444)",
                        }}
                        onClick={() => handleDeleteClick(member)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Faculty</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{facultyToDelete?.fullName}</strong>?
              </p>
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label>Admin Password</label>
                <input
                  type="password"
                  className="search-input"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Confirm with password"
                />
              </div>
              <div className="form-group" style={{ marginTop: "12px" }}>
                <label>Type "DELETE"</label>
                <input
                  type="text"
                  className="search-input"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="view-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: "var(--danger-color, #ef4444)" }}
                onClick={confirmDelete}
                disabled={confirmDeleteText !== "DELETE"}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Login Credentials</h3>
              <button className="modal-close" onClick={closeCredentialsModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                  {selectedFaculty.fullName}
                </div>
                <div style={{ color: "var(--text-muted, #6b7280)" }}>
                  {selectedFaculty.email}
                </div>
              </div>
              <div className="credential-item">
                <label>Username</label>
                <div className="credential-input-group">
                  {editingUsername === selectedFaculty._id ? (
                    <>
                      <input
                        type="text"
                        className="search-input"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                      />
                      <button
                        className="btn-small btn-success"
                        onClick={() => updateUsername(selectedFaculty._id)}
                      >
                        <i className="bi bi-check"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={cancelEditingUsername}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="credential-value">
                        {selectedFaculty.generatedUsername || "Not Set"}
                      </div>
                      <button
                        className="btn-small"
                        onClick={() => startEditingUsername(selectedFaculty)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() =>
                          copyToClipboard(selectedFaculty.generatedUsername)
                        }
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="credential-item">
                <label>Password</label>
                <div className="credential-input-group">
                  {editingPassword === selectedFaculty._id ? (
                    <>
                      <input
                        type="text"
                        className="search-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        className="btn-small btn-success"
                        onClick={() => updatePassword(selectedFaculty._id)}
                      >
                        <i className="bi bi-check"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={cancelEditingPassword}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="credential-value">
                        {showPassword[selectedFaculty._id]
                          ? selectedFaculty.currentPassword
                          : "••••••••"}
                      </div>
                      <button
                        className="btn-small"
                        onClick={() =>
                          togglePasswordVisibility(selectedFaculty._id)
                        }
                      >
                        <i
                          className={`bi bi-eye${
                            showPassword[selectedFaculty._id] ? "-slash" : ""
                          }`}
                        ></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => startEditingPassword(selectedFaculty)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() =>
                          copyToClipboard(selectedFaculty.currentPassword)
                        }
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => shareCredentials(selectedFaculty)}
              >
                <i className="bi bi-share"></i> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showFacultyDetailsModal && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Faculty Profile</h3>
              <button
                className="modal-close"
                onClick={closeFacultyDetailsModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  className="faculty-avatar"
                  style={{ width: "80px", height: "80px", fontSize: "2.5rem" }}
                >
                  <i className="bi bi-person-circle"></i>
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "1.5rem" }}>
                    {selectedFaculty.fullName}
                  </h2>
                  <div style={{ color: "#6b7280" }}>
                    {selectedFaculty.email}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    {getStatusBadge(selectedFaculty.status)}
                  </div>
                </div>
              </div>
              <div
                className="faculty-details-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                }}
              >
                <div>
                  <h4
                    style={{
                      borderBottom: "1px solid var(--border-color, #e5e7eb)",
                      paddingBottom: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    Academic Info
                  </h4>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Department:</strong>{" "}
                    {selectedFaculty.department?.name || "Unassigned"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Employee ID:</strong> {selectedFaculty.employeeId}
                  </div>
                </div>
                <div>
                  <h4
                    style={{
                      borderBottom: "1px solid var(--border-color, #e5e7eb)",
                      paddingBottom: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    System Info
                  </h4>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Joined:</strong>{" "}
                    {new Date(selectedFaculty.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Username:</strong>{" "}
                    {selectedFaculty.generatedUsername}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "24px" }}>
                <h4
                  style={{
                    borderBottom: "1px solid var(--border-color, #e5e7eb)",
                    paddingBottom: "8px",
                    marginBottom: "12px",
                  }}
                >
                  Skills
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedFaculty.skills?.map((skill, i) => (
                    <span key={i} className="skill-tag-small">
                      {skill}
                    </span>
                  )) || "No skills listed"}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="view-btn" onClick={closeFacultyDetailsModal}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  closeFacultyDetailsModal();
                  navigateToFacultyProfile(selectedFaculty._id);
                }}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyList;
