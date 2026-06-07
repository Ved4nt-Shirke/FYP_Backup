import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showAlert } from "../utils/alertUtils";
import { generateUsername, generateSecurePassword, validatePassword } from "../utils/credentialGenerator";
import "./AdminManagement.css";

const AdminManagement = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageBox, setMessageBox] = useState({ show: false, type: "", message: "" });
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [superadminPassword, setSuperadminPassword] = useState("");
  const [showSuperadminPassword, setShowSuperadminPassword] = useState(false);
  const [viewedPassword, setViewedPassword] = useState("");
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    institution: ""
  });
  const [adminCreating, setAdminCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = admins.filter(
        (admin) =>
          admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAdmins(filtered);
    } else {
      setFilteredAdmins(admins);
    }
  }, [searchTerm, admins]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/superadmin/admins");
      if (response.data.success) {
        setAdmins(response.data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      showMessage("error", "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await axios.get("/superadmin/institutions");
      if (response.data.success) {
        setInstitutions(response.data.institutions || []);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  };

  const showMessage = (type, message) => {
    showAlert(message, type);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !superadminPassword) {
      showMessage("error", "Please fill in all fields");
      return;
    }

    try {
      const response = await axios.put(`/superadmin/admins/${selectedAdmin._id}/password`, {
        newPassword
      });

      if (response.data.success) {
        showMessage("success", "Password changed successfully");
        setShowPasswordModal(false);
        setNewPassword("");
        setSuperadminPassword("");
        setSelectedAdmin(null);
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to change password");
    }
  };

  const handleViewPassword = async () => {
    if (!superadminPassword) {
      showMessage("error", "Please enter superadmin password");
      return;
    }

    try {
      const response = await axios.post(`/superadmin/admin/${selectedAdmin._id}/view-password`, {
        superadminPassword
      });

      if (response.data.success) {
        setViewedPassword(response.data.password);
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to retrieve password");
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (window.confirm(`Are you sure you want to delete admin "${admin.name}"?`)) {
      try {
        const response = await axios.delete(`/superadmin/admin/${admin._id}`);
        if (response.data.success) {
          showMessage("success", "Admin deleted successfully");
          fetchAdmins();
        }
      } catch (error) {
        showMessage("error", error.response?.data?.message || "Failed to delete admin");
      }
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email || !adminForm.institution) {
      showMessage("error", "Please fill in all fields");
      return;
    }

    try {
      setAdminCreating(true);
      const response = await axios.post("/superadmin/create-admin", adminForm);
      
      if (response.data.success) {
        showMessage("success", "Admin created successfully");
        setShowCreateModal(false);
        setAdminForm({ name: "", email: "", institution: "" });
        fetchAdmins();
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to create admin");
    } finally {
      setAdminCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-management-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Management</h1>
          <p className="page-subtitle">Manage system administrators</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus"></i>
          Create Admin
        </button>
      </div>

      {messageBox.show && (
        <div className={`alert alert-${messageBox.type}`}>
          <i className={`fas fa-${messageBox.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {messageBox.message}
        </div>
      )}

      <div className="search-bar">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Search admins by name, email, or institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredAdmins.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-user-shield empty-icon"></i>
          <h3>No admins found</h3>
          <p>
            {searchTerm
              ? "No admins match your search criteria"
              : "Get started by creating your first admin"}
          </p>
          {!searchTerm && (
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>
              <i className="fas fa-plus"></i>
              Create Admin
            </button>
          )}
        </div>
      ) : (
        <div className="admins-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Institution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    <div className="admin-info">
                      <div className="admin-avatar">
                        {admin.name?.charAt(0).toUpperCase()}
                      </div>
                      <span>{admin.name}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                  <td>{admin.institution?.name || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn btn-password"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowPasswordModal(true);
                        }}
                        title="Change Password"
                      >
                        <i className="fas fa-key"></i>
                      </button>
                      <button
                        className="action-btn btn-view"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowViewPasswordModal(true);
                        }}
                        title="View Password"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="action-btn btn-delete"
                        onClick={() => handleDeleteAdmin(admin)}
                        title="Delete"
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

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Admin</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateAdmin}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Institution *</label>
                  <select
                    className="form-input"
                    value={adminForm.institution}
                    onChange={(e) => setAdminForm({ ...adminForm, institution: e.target.value })}
                    required
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={adminCreating}>
                  {adminCreating ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Change password for: <strong>{selectedAdmin?.name}</strong></p>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <i className={`fas fa-eye${showNewPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Superadmin Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showSuperadminPassword ? "text" : "password"}
                    className="form-input"
                    value={superadminPassword}
                    onChange={(e) => setSuperadminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowSuperadminPassword(!showSuperadminPassword)}
                  >
                    <i className={`fas fa-eye${showSuperadminPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button className="btn-submit" onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Password Modal */}
      {showViewPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowViewPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>View Password</h2>
              <button className="modal-close" onClick={() => setShowViewPasswordModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>View password for: <strong>{selectedAdmin?.name}</strong></p>
              {!viewedPassword ? (
                <div className="form-group">
                  <label>Superadmin Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      value={superadminPassword}
                      onChange={(e) => setSuperadminPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="password-display">
                  <label>Admin Password</label>
                  <div className="password-value">{viewedPassword}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowViewPasswordModal(false);
                  setViewedPassword("");
                  setSuperadminPassword("");
                }}
              >
                Close
              </button>
              {!viewedPassword && (
                <button className="btn-submit" onClick={handleViewPassword}>
                  View Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
