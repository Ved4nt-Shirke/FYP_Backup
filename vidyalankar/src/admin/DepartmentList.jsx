import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./DepartmentList.css";

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

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

    fetchDepartments();
  }, [navigate]);

  useEffect(() => {
    // Filter departments based on search term
    const filtered = departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredDepartments(filtered);
  }, [departments, searchTerm]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments);
      } else {
        showErrorAlert("Failed to fetch departments");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      showErrorAlert("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
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
        config.admin.deleteDepartment(departmentToDelete._id),
        {
          data: { password: adminPassword },
        },
      );

      if (response.data.success) {
        showSuccessAlert(response.data.message);
        setDepartments(
          departments.filter((dept) => dept._id !== departmentToDelete._id),
        );
        setShowDeleteModal(false);
        setDepartmentToDelete(null);
        setAdminPassword("");
        setConfirmDeleteText("");
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error deleting department:", err);
      showErrorAlert("Failed to delete department");
    }
  };

  const handleCreateDepartment = () => {
    navigate("/admin-create-department");
  };

  const handleEditDepartment = (department) => {
    navigate("/admin-create-department", {
      state: { department, isEdit: true },
    });
  };

  const handleViewDepartment = (department) => {
    navigate(`/admin-department-management/${department._id}`, {
      state: { department },
    });
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="page-header">
          <div>
            <h2>Department Management</h2>
            <p>Managing {adminInstitution} institution</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="page-header">
        <div className="department-header-text">
          <h2>Department Management</h2>
          <p>Managing {adminInstitution} institution</p>
        </div>
        <button className="btn-primary" onClick={handleCreateDepartment}>
          <i className="bi bi-plus-lg"></i>
          Add Department
        </button>
      </div>

      {/* Department Cards */}
      <div className="departments-overview">
        <h3>Departments</h3>

        {/* Search Controls */}
        <div className="search-section">
          <div className="search-container">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-building-dash"></i>
            </div>
            <h3>
              {searchTerm ? "No departments found" : "No Departments Yet"}
            </h3>
            <p>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by creating your first department."}
            </p>
            {!searchTerm && (
              <button className="btn-primary" onClick={handleCreateDepartment}>
                <i className="bi bi-plus-lg"></i>
                Create Department
              </button>
            )}
          </div>
        ) : (
          <div className="departments-grid-small">
            {filteredDepartments.map((department) => (
              <div
                key={department._id}
                className="department-small-card"
                onClick={() => handleViewDepartment(department)}
              >
                <div className="department-small-header">
                  <div className="department-small-icon">
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="department-small-code">{department.code}</div>
                </div>
                <div className="department-small-content">
                  <h4 className="department-small-name">{department.name}</h4>
                  <p className="department-small-meta">
                    Created{" "}
                    {new Date(department.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="department-small-footer">
                  <span className="manage-link">Manage Faculty</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3>Delete Department</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <i
                  className="bi bi-exclamation-triangle-fill"
                  style={{ color: "#ef4444" }}
                ></i>
                <div>
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>{departmentToDelete?.name}</strong>?
                  </p>
                  <p className="warning-text">
                    This will permanently remove the department and cannot be
                    undone. All associated data may be affected.
                  </p>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label htmlFor="adminPassword">Admin Password</label>
                <input
                  type="password"
                  id="adminPassword"
                  className="form-control"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your admin password to confirm"
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label htmlFor="confirmDeleteText">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  id="confirmDeleteText"
                  className="form-control"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
                disabled={
                  confirmDeleteText.toUpperCase() !== "DELETE" ||
                  !adminPassword.trim()
                }
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
