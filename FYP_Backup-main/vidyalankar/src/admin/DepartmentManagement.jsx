import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { showSuccessAlert, showErrorAlert } from "../utils/alertUtils.jsx";
import { config } from "../config/api";
import "./DepartmentManagement.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import BulkUploadFacultyModal from "./BulkUploadFacultyModal";

const DepartmentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [unassignedStaff, setUnassignedStaff] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [transferTargetDepartment, setTransferTargetDepartment] = useState("");
  const [filteredAssignedStaff, setFilteredAssignedStaff] = useState([]);
  const [filteredUnassignedStaff, setFilteredUnassignedStaff] = useState([]);
  const [activeView, setActiveView] = useState("faculty"); // "faculty" or "admin"
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

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

    fetchDepartmentData();
    fetchAllDepartments();
  }, [id, navigate]);

  const downloadDepartmentCredentialsPDF = () => {
    const facultyMembers = assignedStaff.filter(s => s.staffType === "faculty");

    if (facultyMembers.length === 0) {
      showErrorAlert("No assigned faculty found in this department.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.text(`Faculty Login Credentials - ${department.name} (${department.code})`, pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, {
      align: "center",
    });

    const tableData = facultyMembers.map((fac) => [
      fac.fullName,
      fac.employeeId,
      fac.email,
      fac.generatedUsername || "Not set",
      fac.currentPassword || "Not set",
    ]);

    autoTable(doc, {
      head: [["Full Name", "ID", "Email", "Username", "Password"]],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      margin: 10,
      didDrawPage: (data) => {
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(9);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    doc.save(`${department.code}_Faculty_Credentials.pdf`);
    showSuccessAlert("PDF downloaded successfully.");
  };

  // Filter staff based on active view
  useEffect(() => {
    // Filter by staff type based on active view
    const filterByType = (staffList) => {
      if (activeView === "faculty") {
        return staffList.filter((staff) => staff.staffType === "faculty");
      } else if (activeView === "admin") {
        return staffList.filter((staff) => staff.staffType === "office");
      }
      return staffList;
    };

    setFilteredAssignedStaff(filterByType(assignedStaff));
    setFilteredUnassignedStaff(filterByType(unassignedStaff));
  }, [assignedStaff, unassignedStaff, activeView]);

  const fetchDepartmentData = async () => {
    try {
      const response = await axios.get(config.admin.getDepartmentFaculty(id));
      if (response.data.success) {
        setDepartment(response.data.department);
        setAssignedStaff(response.data.assignedFaculty);
        setUnassignedStaff(response.data.unassignedFaculty);
      } else {
        showErrorAlert("Failed to fetch department data");
      }
    } catch (err) {
      console.error("Error fetching department data:", err);
      showErrorAlert("Failed to fetch department data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setAllDepartments(
          response.data.departments.filter((dept) => dept._id !== id),
        );
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleRemoveStaff = async (staffId, staffType) => {
    if (
      !window.confirm(
        `Are you sure you want to remove this ${
          staffType === "faculty" ? "faculty" : "office staff"
        } from the department?`,
      )
    ) {
      return;
    }

    try {
      const endpoint =
        staffType === "faculty"
          ? config.admin.updateFacultyDepartment(staffId)
          : config.admin.updateOfficeStaffDepartment(staffId);

      const response = await axios.put(endpoint, { departmentId: null });

      if (response.data.success) {
        showSuccessAlert(
          `${
            staffType === "faculty" ? "Faculty" : "Office staff"
          } removed from department successfully`,
        );
        fetchDepartmentData(); // Refresh data
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error removing staff:", err);
      showErrorAlert(
        `Failed to remove ${
          staffType === "faculty" ? "faculty" : "office staff"
        } from department`,
      );
    }
  };

  const handleTransferStaff = async () => {
    if (!selectedStaff || !transferTargetDepartment) {
      showErrorAlert("Please select staff and target department");
      return;
    }

    try {
      const endpoint =
        selectedStaff.staffType === "faculty"
          ? config.admin.transferFaculty(selectedStaff._id)
          : config.admin.transferOfficeStaff(selectedStaff._id);

      const response = await axios.put(endpoint, {
        fromDepartmentId: id,
        toDepartmentId: transferTargetDepartment,
      });

      if (response.data.success) {
        showSuccessAlert(
          `${
            selectedStaff.staffType === "faculty" ? "Faculty" : "Office staff"
          } transferred successfully`,
        );
        setShowTransferModal(false);
        setSelectedStaff(null);
        setTransferTargetDepartment("");
        fetchDepartmentData(); // Refresh data
      } else {
        showErrorAlert(response.data.message);
      }
    } catch (err) {
      console.error("Error transferring staff:", err);
      showErrorAlert(
        `Failed to transfer ${
          selectedStaff.staffType === "faculty" ? "faculty" : "office staff"
        }`,
      );
    }
  };

  const openTransferModal = (staff) => {
    setSelectedStaff(staff);
    setShowTransferModal(true);
  };

  const openStaffDetailsModal = (staff) => {
    setSelectedStaff(staff);
    setShowStaffDetailsModal(true);
  };

  const closeStaffDetailsModal = () => {
    setShowStaffDetailsModal(false);
    setSelectedStaff(null);
  };

  const navigateToStaffProfile = (staffId, staffType) => {
    if (staffType === "faculty") {
      navigate(`/admin-edit-faculty/${staffId}`);
    } else {
      // For office staff, you might want to add an edit route later
      // For now, just show details
      showErrorAlert("Office staff profile editing not yet implemented");
    }
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading department management...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="admin-content">
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-building-x"></i>
          </div>
          <h3>Department Not Found</h3>
          <p>The department you're looking for doesn't exist.</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/admin-departments")}
          >
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            className="btn-back"
            onClick={() => navigate("/admin-departments")}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <h2>{department.name}</h2>
            <p className="department-code">
              {department.code} • {adminInstitution}
            </p>
          </div>
        </div>
        <div className="header-right" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {activeView === "faculty" && (
            <>
              <button
                className="btn-secondary"
                onClick={downloadDepartmentCredentialsPDF}
                title="Download all faculty credentials as PDF"
              >
                <i className="bi bi-file-earmark-pdf"></i> Export PDF
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowBulkUploadModal(true)}
                title="Bulk upload faculty to this department"
              >
                <i className="bi bi-upload"></i> Bulk Upload
              </button>
            </>
          )}
          <button
            className="btn-primary"
            onClick={() => navigate(`/admin/departments/${id}/courses`)}
          >
            <i className="bi bi-journal-bookmark"></i>
            Manage Courses & Divisions
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`tab-button ${activeView === "faculty" ? "active" : ""}`}
          onClick={() => setActiveView("faculty")}
        >
          <i className="bi bi-person-circle"></i>
          Faculty Management
        </button>
        <button
          className={`tab-button ${activeView === "admin" ? "active" : ""}`}
          onClick={() => setActiveView("admin")}
        >
          <i className="bi bi-person-badge"></i>
          Office Staff
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-people"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{filteredAssignedStaff.length}</div>
            <div className="stat-label">
              Assigned {activeView === "faculty" ? "Faculty" : "Staff"}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="bi bi-person-dash"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{filteredUnassignedStaff.length}</div>
            <div className="stat-label">
              Unassigned {activeView === "faculty" ? "Faculty" : "Staff"}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Staff Section */}
      <div className="faculty-section">
        <h3>Assigned {activeView === "faculty" ? "Faculty" : "Staff"}</h3>
        {filteredAssignedStaff.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-people"></i>
            </div>
            <h4>
              No {activeView === "faculty" ? "Faculty" : "Staff"} Assigned
            </h4>
            <p>
              Add {activeView === "faculty" ? "faculty" : "staff"} members to
              this department.
            </p>
          </div>
        ) : (
          <div className="faculty-grid compact">
            {filteredAssignedStaff.map((staff) => (
              <div
                key={staff._id}
                className="faculty-card compact"
                onClick={() => openStaffDetailsModal(staff)}
              >
                <div className="faculty-header">
                  <div className="faculty-avatar">
                    <i
                      className={`bi ${
                        staff.staffType === "faculty"
                          ? "bi-person-circle"
                          : "bi-person-badge"
                      }`}
                    ></i>
                  </div>
                  <div className="faculty-actions">
                    <button
                      className="action-btn transfer-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTransferModal(staff);
                      }}
                      title="Transfer to another department"
                    >
                      <i className="bi bi-arrow-right-short"></i>
                    </button>
                    <button
                      className="action-btn remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStaff(staff._id, staff.staffType);
                      }}
                      title="Remove from department"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="faculty-content">
                  <h4 className="faculty-name">{staff.fullName}</h4>
                  <p className="faculty-employee-id">{staff.employeeId}</p>
                  <p className="faculty-email">{staff.email}</p>
                  <span className={`staff-type-badge ${staff.staffType}`}>
                    {staff.staffType === "faculty" ? "Faculty" : "Office Staff"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Staff Modal */}
      {showTransferModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Transfer {activeView === "faculty" ? "Faculty" : "Staff"}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedStaff(null);
                  setTransferTargetDepartment("");
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="transfer-info">
                <h4>Transferring: {selectedStaff.fullName}</h4>
                <p>Current Department: {department.name}</p>
                <p>
                  Type:{" "}
                  {selectedStaff.staffType === "faculty"
                    ? "Faculty"
                    : "Office Staff"}
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="targetDepartment">
                  Select Target Department:
                </label>
                <select
                  id="targetDepartment"
                  value={transferTargetDepartment}
                  onChange={(e) => setTransferTargetDepartment(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select Department...</option>
                  {allDepartments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                  <option value="">Remove from all departments</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedStaff(null);
                  setTransferTargetDepartment("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleTransferStaff}
                disabled={!transferTargetDepartment}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {showStaffDetailsModal && selectedStaff && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>{activeView === "faculty" ? "Faculty" : "Staff"} Details</h3>
              <button className="modal-close" onClick={closeStaffDetailsModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="faculty-details">
                <div className="faculty-profile-header">
                  <div className="faculty-avatar large">
                    <i
                      className={`bi ${
                        selectedStaff.staffType === "faculty"
                          ? "bi-person-circle"
                          : "bi-person-badge"
                      }`}
                    ></i>
                  </div>
                  <div className="faculty-basic-info">
                    <h2>{selectedStaff.fullName}</h2>
                    <p className="faculty-employee-id">
                      Employee ID: {selectedStaff.employeeId}
                    </p>
                    <p className="faculty-email">{selectedStaff.email}</p>
                    <p className="faculty-status">
                      Status:{" "}
                      <span
                        className={`status-${selectedStaff.status || "active"}`}
                      >
                        {selectedStaff.status || "Active"}
                      </span>
                    </p>
                    <p className="staff-type">
                      Type:{" "}
                      {selectedStaff.staffType === "faculty"
                        ? "Faculty"
                        : "Office Staff"}
                    </p>
                  </div>
                </div>

                <div className="faculty-details-grid">
                  <div className="detail-section">
                    <h4>Department Information</h4>
                    <div className="detail-item">
                      <label>Current Department:</label>
                      <span>
                        {selectedStaff.department
                          ? `${selectedStaff.department.name} (${selectedStaff.department.code})`
                          : "Not Assigned"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Institution:</label>
                      <span>{adminInstitution}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Skills & Expertise</h4>
                    <div className="skills-list">
                      {selectedStaff.staffType === "faculty" &&
                      selectedStaff.skills &&
                      selectedStaff.skills.length > 0 ? (
                        selectedStaff.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="no-data">
                          {selectedStaff.staffType === "faculty"
                            ? "No skills specified"
                            : "Not applicable for office staff"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Account Information</h4>
                    <div className="detail-item">
                      <label>Username:</label>
                      <span>
                        {selectedStaff.generatedUsername || "Not set"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Created:</label>
                      <span>
                        {selectedStaff.createdAt
                          ? new Date(
                              selectedStaff.createdAt,
                            ).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={closeStaffDetailsModal}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  closeStaffDetailsModal();
                  navigateToStaffProfile(
                    selectedStaff._id,
                    selectedStaff.staffType,
                  );
                }}
              >
                <i className="bi bi-person-lines-fill"></i>
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
      <BulkUploadFacultyModal
        show={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onUploadSuccess={fetchDepartmentData}
        preselectedDepartmentId={id}
      />
    </div>
  );
};

export default DepartmentManagement;
