import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import "./FacultyList.css";

const OfficeStaffList = () => {
  const navigate = useNavigate();
  const [officeStaff, setOfficeStaff] = useState([]);
  const [filteredOfficeStaff, setFilteredOfficeStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [stats, setStats] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [editingUsername, setEditingUsername] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [editingPassword, setEditingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [staffToTransfer, setStaffToTransfer] = useState(null);
  const [targetDepartment, setTargetDepartment] = useState("");
  const [transferring, setTransferring] = useState(false);

  const adminInstitution = localStorage.getItem("college") || "VP";

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchOfficeStaff();
    fetchDepartments();
    fetchStats();
  }, [navigate]);

  useEffect(() => {
    let filtered = officeStaff;
    if (searchTerm) {
      filtered = filtered.filter(
        (staff) =>
          staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    setFilteredOfficeStaff(filtered);
  }, [officeStaff, searchTerm]);

  const fetchOfficeStaff = async () => {
    try {
      // Use direct API path since axios has baseURL set to '/api'
      const response = await axios.get("/admin/office-staff");
      if (response.data.success) {
        setOfficeStaff(response.data.officeStaff || []);
      } else {
        showErrorAlert(response.data.message || "Failed to fetch office staff");
      }
    } catch (err) {
      console.error("Error fetching office staff:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to fetch office staff";
      showErrorAlert(errorMessage);
      // Set empty array on error to prevent UI issues
      setOfficeStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/admin/departments");
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchStats = async () => {
    try {
      // Office staff stats endpoint - using direct path since it's not in config yet
      const response = await axios.get("/admin/office-staff-stats");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching office staff stats:", err);
    }
  };

  const handleDeleteClick = (staffMember) => {
    setStaffToDelete(staffMember);
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
        `/admin/office-staff/${staffToDelete._id}`,
        { data: { password: adminPassword } },
      );
      if (response.data.success) {
        showSuccessAlert(response.data.message);
        setOfficeStaff(
          officeStaff.filter((staff) => staff._id !== staffToDelete._id),
        );
        setShowDeleteModal(false);
        setStaffToDelete(null);
        setAdminPassword("");
        setConfirmDeleteText("");
        fetchStats();
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error deleting office staff:", err);
      showErrorAlert("Failed to delete office staff");
    }
  };

  const handleCreateStaff = () =>
    navigate("/admin-panel", { state: { activeTab: "office" } });
  const handleEditStaff = (staffMember) =>
    navigate(`/admin-edit-office-staff/${staffMember._id}`, {
      state: { staff: staffMember },
    });
  const handleViewStaff = (staffMember) => openStaffDetailsModal(staffMember);

  const openStaffDetailsModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowStaffDetailsModal(true);
  };
  const closeStaffDetailsModal = () => {
    setShowStaffDetailsModal(false);
    setSelectedStaff(null);
  };
  const navigateToStaffProfile = (staffId) =>
    navigate(`/admin-edit-office-staff/${staffId}`);

  const openCredentialsModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowCredentialsModal(true);
  };
  const closeCredentialsModal = () => {
    setShowCredentialsModal(false);
    setSelectedStaff(null);
    setEditingUsername(null);
    setNewUsername("");
    setEditingPassword(null);
    setNewPassword("");
  };
  const togglePasswordVisibility = (staffId) => {
    setShowPassword((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };
  const startEditingUsername = (staffMember) => {
    setEditingUsername(staffMember._id);
    setNewUsername(staffMember.generatedUsername || "");
  };
  const cancelEditingUsername = () => {
    setEditingUsername(null);
    setNewUsername("");
  };
  const startEditingPassword = (staffMember) => {
    setEditingPassword(staffMember._id);
    setNewPassword(staffMember.currentPassword || "");
  };
  const cancelEditingPassword = () => {
    setEditingPassword(null);
    setNewPassword("");
  };

  const updateUsername = async (staffId) => {
    if (!newUsername.trim()) return showErrorAlert("Username cannot be empty");
    try {
      const response = await axios.put(
        `/admin/office-staff/${staffId}/username`,
        {
          newUsername: newUsername.trim(),
        },
      );
      if (response.data.success) {
        showSuccessAlert("Username updated successfully!");
        setOfficeStaff(
          officeStaff.map((staff) =>
            staff._id === staffId
              ? { ...staff, generatedUsername: newUsername.trim() }
              : staff,
          ),
        );
        if (selectedStaff && selectedStaff._id === staffId) {
          setSelectedStaff({
            ...selectedStaff,
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

  const updatePassword = async (staffId) => {
    if (!newPassword.trim()) return showErrorAlert("Password cannot be empty");
    if (newPassword.length < 6)
      return showErrorAlert("Password must be at least 6 characters");
    try {
      const response = await axios.put(
        `/admin/office-staff/${staffId}/password`,
        {
          newPassword: newPassword.trim(),
        },
      );
      if (response.data.success) {
        showSuccessAlert("Password updated successfully!");
        setOfficeStaff(
          officeStaff.map((staff) =>
            staff._id === staffId
              ? { ...staff, currentPassword: newPassword.trim() }
              : staff,
          ),
        );
        if (selectedStaff && selectedStaff._id === staffId) {
          setSelectedStaff({
            ...selectedStaff,
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

  const handleTransferClick = (staffMember) => {
    setStaffToTransfer(staffMember);
    setTargetDepartment(staffMember.department?._id || "");
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setStaffToTransfer(null);
    setTargetDepartment("");
  };

  const confirmTransfer = async () => {
    if (!targetDepartment && staffToTransfer.department) {
      showErrorAlert("Please select a target department");
      return;
    }
    
    setTransferring(true);
    try {
      const response = await axios.put(
        `/admin/office-staff/${staffToTransfer._id}/transfer`,
        {
          fromDepartmentId: staffToTransfer.department?._id || null,
          toDepartmentId: targetDepartment || null,
        }
      );
      
      if (response.data.success) {
        showSuccessAlert(response.data.message);
        fetchOfficeStaff();
        closeTransferModal();
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error transferring office staff:", err);
      showErrorAlert(err.response?.data?.message || "Failed to transfer office staff");
    } finally {
      setTransferring(false);
    }
  };

  const shareCredentials = (staffMember) => {
    const credentials = `Office Staff Login Credentials\nName: ${staffMember.fullName}\nUsername: ${staffMember.generatedUsername}\nPassword: ${staffMember.currentPassword}\nPlease change your password after first login.`;
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
          <p>Loading office staff...</p>
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
              <div className="stat-number">{filteredOfficeStaff.length}</div>
              <div className="stat-label">Total Office Staff</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="bi bi-person-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {
                  filteredOfficeStaff.filter((s) => s.status === "active")
                    .length
                }
              </div>
              <div className="stat-label">Active Staff</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="faculty-controls">
        <div className="search-container">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search office staff name, ID, email..."
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
          <button className="btn-primary" onClick={handleCreateStaff}>
            <i className="bi bi-person-plus"></i> Add Office Staff
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredOfficeStaff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-person-badge"></i>
          </div>
          <h3>
            {searchTerm ? "No office staff found" : "No Office Staff Yet"}
          </h3>
          <p>
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Get started by adding your first office staff member."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="faculty-grid">
          {filteredOfficeStaff.map((member) => (
            <div
              key={member._id}
              className="faculty-card"
              onClick={() => openStaffDetailsModal(member)}
            >
              <div className="faculty-header">
                <div className="faculty-avatar">
                  <i className="bi bi-person-badge"></i>
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
                    className="action-btn transfer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTransferClick(member);
                    }}
                    title="Transfer Department"
                  >
                    <i className="bi bi-arrow-left-right"></i>
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStaff(member);
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
                <p className="faculty-department">
                  <i className="bi bi-building"></i> {member.department?.name || "No Department"}
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
              {filteredOfficeStaff.map((member) => (
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
                        onClick={() => handleTransferClick(member)}
                        title="Transfer Department"
                        style={{
                          color: "var(--primary-accent, #3b82f6)",
                          borderColor: "var(--primary-accent, #3b82f6)",
                        }}
                      >
                        <i className="bi bi-arrow-left-right"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => handleEditStaff(member)}
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
              <h3>Delete Office Staff</h3>
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
                <strong>{staffToDelete?.fullName}</strong>?
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
      {showCredentialsModal && selectedStaff && (
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
                  {selectedStaff.fullName}
                </div>
                <div style={{ color: "var(--text-muted, #6b7280)" }}>
                  {selectedStaff.email}
                </div>
              </div>
              <div className="credential-item">
                <label>Username</label>
                <div className="credential-input-group">
                  {editingUsername === selectedStaff._id ? (
                    <>
                      <input
                        type="text"
                        className="search-input"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                      />
                      <button
                        className="btn-small btn-success"
                        onClick={() => updateUsername(selectedStaff._id)}
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
                        {selectedStaff.generatedUsername || "Not Set"}
                      </div>
                      <button
                        className="btn-small"
                        onClick={() => startEditingUsername(selectedStaff)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() =>
                          copyToClipboard(selectedStaff.generatedUsername)
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
                  {editingPassword === selectedStaff._id ? (
                    <>
                      <input
                        type="text"
                        className="search-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        className="btn-small btn-success"
                        onClick={() => updatePassword(selectedStaff._id)}
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
                        {showPassword[selectedStaff._id]
                          ? selectedStaff.currentPassword
                          : "••••••••"}
                      </div>
                      <button
                        className="btn-small"
                        onClick={() =>
                          togglePasswordVisibility(selectedStaff._id)
                        }
                      >
                        <i
                          className={`bi bi-eye${
                            showPassword[selectedStaff._id] ? "-slash" : ""
                          }`}
                        ></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() => startEditingPassword(selectedStaff)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn-small"
                        onClick={() =>
                          copyToClipboard(selectedStaff.currentPassword)
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
                onClick={() => shareCredentials(selectedStaff)}
              >
                <i className="bi bi-share"></i> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && staffToTransfer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="bi bi-arrow-left-right"></i> Transfer Office Staff
              </h3>
              <button className="modal-close" onClick={closeTransferModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="transfer-info">
                <div className="transfer-staff-info">
                  <div className="faculty-avatar" style={{ width: "60px", height: "60px" }}>
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0" }}>{staffToTransfer.fullName}</h4>
                    <p style={{ margin: "0", color: "#6b7280", fontSize: "14px" }}>
                      {staffToTransfer.employeeId}
                    </p>
                  </div>
                </div>
                
                <div className="transfer-departments">
                  <div className="department-box current-dept">
                    <label>Current Department</label>
                    <div className="dept-display">
                      <i className="bi bi-building"></i>
                      <span>{staffToTransfer.department?.name || "Not Assigned"}</span>
                    </div>
                  </div>
                  
                  <div className="transfer-arrow">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                  
                  <div className="department-box target-dept">
                    <label>Transfer To</label>
                    <select
                      className="dept-select"
                      value={targetDepartment}
                      onChange={(e) => setTargetDepartment(e.target.value)}
                    >
                      <option value="">Unassign from Department</option>
                      {departments
                        .filter((dept) => dept._id !== staffToTransfer.department?._id)
                        .map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                
                {!targetDepartment && !staffToTransfer.department && (
                  <div className="transfer-note info">
                    <i className="bi bi-info-circle"></i>
                    <span>This staff member is not currently assigned to any department. Select a department to assign them.</span>
                  </div>
                )}
                
                {!targetDepartment && staffToTransfer.department && (
                  <div className="transfer-note warning">
                    <i className="bi bi-exclamation-triangle"></i>
                    <span>This will remove the staff member from {staffToTransfer.department?.name}.</span>
                  </div>
                )}
                
                {targetDepartment && (
                  <div className="transfer-note success">
                    <i className="bi bi-check-circle"></i>
                    <span>
                      {staffToTransfer.department 
                        ? `Transfer from ${staffToTransfer.department?.name} to ${departments.find(d => d._id === targetDepartment)?.name}`
                        : `Assign to ${departments.find(d => d._id === targetDepartment)?.name}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="view-btn" onClick={closeTransferModal} disabled={transferring}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={confirmTransfer}
                disabled={transferring || (targetDepartment === (staffToTransfer.department?._id || ""))}
              >
                {transferring ? (
                  <>
                    <span className="spinner-sm"></span> Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i> Confirm Transfer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showStaffDetailsModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Office Staff Profile</h3>
              <button className="modal-close" onClick={closeStaffDetailsModal}>
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
                  <i className="bi bi-person-badge"></i>
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: "1.5rem" }}>
                    {selectedStaff.fullName}
                  </h2>
                  <div style={{ color: "#6b7280" }}>{selectedStaff.email}</div>
                  <div style={{ marginTop: "8px" }}>
                    {getStatusBadge(selectedStaff.status)}
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
                    Professional Info
                  </h4>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Department:</strong>{" "}
                    {selectedStaff.department?.name || "Unassigned"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Employee ID:</strong> {selectedStaff.employeeId}
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
                    {selectedStaff.createdAt
                      ? new Date(selectedStaff.createdAt).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Username:</strong> {selectedStaff.generatedUsername}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="view-btn" onClick={closeStaffDetailsModal}>
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  closeStaffDetailsModal();
                  navigateToStaffProfile(selectedStaff._id);
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

export default OfficeStaffList;
