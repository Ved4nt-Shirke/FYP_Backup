import React, { useEffect, useState } from "react";
import { config } from "../config/api";
import "./ManageStudents.css";

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Filters
  const [filterDivision, setFilterDivision] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  
  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Password display (view only - no generation on click)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedPasswordStudent, setGeneratedPasswordStudent] = useState("");

  useEffect(() => {
    fetchStudents();
    
    // Log user info for debugging
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        console.log('Current user from token:', decoded);
      } catch (e) {
        console.log('Could not decode token:', e.message);
      }
    }
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      
      let url = config.students;
      const params = new URLSearchParams();
      
      if (filterDivision.trim()) {
        params.append("division", filterDivision.trim());
      }
      if (filterBatch.trim()) {
        params.append("batch", filterBatch.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch students", err);
      setError("Could not load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    fetchStudents();
  };

  const handleFilterClear = () => {
    setFilterDivision("");
    setFilterBatch("");
    setFilterSearch("");
    setCurrentPage(1);
  };

  const handleEditStart = (student) => {
    setEditingId(student._id);
    setEditData({ ...student });
    setError("");
    setSuccess("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleEditSave = async () => {
    if (!editData.studentName?.trim()) {
      setError("Student name is required.");
      return;
    }
    if (!editData.rollNo?.trim()) {
      setError("Roll number is required.");
      return;
    }
    if (!editData.enrollmentNo?.trim()) {
      setError("Enrollment number is required.");
      return;
    }
    if (!editData.batch?.trim()) {
      setError("Batch is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("You are not authenticated. Please login again.");
        setLoading(false);
        return;
      }
      
      const url = `${config.students}/${editingId}`;
      
      console.log('=== PUT Request Debug ===');
      console.log('URL:', url);
      console.log('Student ID:', editingId);
      console.log('Token present:', !!token);
      console.log('Token preview:', token?.substring(0, 20) + '...');
      console.log('Payload:', {
        rollNo: editData.rollNo.trim(),
        enrollmentNo: editData.enrollmentNo.trim(),
        studentName: editData.studentName.trim(),
        batch: editData.batch.trim(),
        division: editData.division?.trim() || "",
      });
      
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollNo: editData.rollNo.trim(),
          enrollmentNo: editData.enrollmentNo.trim(),
          studentName: editData.studentName.trim(),
          batch: editData.batch.trim(),
          division: editData.division?.trim() || "",
        }),
      });

      const result = await res.json();
      
      console.log('=== PUT Response ===');
      console.log('Status:', res.status);
      console.log('Response:', result);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized: Your session may have expired. Please login again.");
        } else if (res.status === 403) {
          throw new Error("Forbidden: You do not have permission to edit students. Please ensure you are logged in as office staff.");
        } else if (res.status === 404) {
          throw new Error("Student not found or route not found. Please refresh and try again.");
        } else {
          throw new Error(result.message || `Failed to update student (Error ${res.status})`);
        }
      }

      setSuccess(`Student "${editData.studentName}" updated successfully.`);
      setEditingId(null);
      setEditData({});
      
      // Update the student in the list
      setStudents(
        students.map((s) => (s._id === editingId ? result.student : s))
      );
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Edit error:", err);
      setError(err.message || "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (student) => {
    setDeleteConfirmId(student._id);
    setDeleteConfirmName(student.studentName);
    setError("");
    setSuccess("");
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmName("");
  };

  const handleDeleteConfirmed = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("You are not authenticated. Please login again.");
        setLoading(false);
        return;
      }
      
      const url = `${config.students}/${deleteConfirmId}`;
      
      console.log('=== DELETE Request Debug ===');
      console.log('URL:', url);
      console.log('Student ID:', deleteConfirmId);
      console.log('Token present:', !!token);
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await res.json();
      
      console.log('=== DELETE Response ===');
      console.log('Status:', res.status);
      console.log('Response:', result);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized: Your session may have expired. Please login again.");
        } else if (res.status === 403) {
          throw new Error("Forbidden: You do not have permission to delete students. Please ensure you are logged in as office staff.");
        } else if (res.status === 404) {
          throw new Error("Student not found or route not found. Please refresh and try again.");
        } else {
          throw new Error(result.message || `Failed to delete student (Error ${res.status})`);
        }
      }

      setSuccess(`Student "${deleteConfirmName}" deleted successfully.`);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      
      // Remove from list
      setStudents(students.filter((s) => s._id !== deleteConfirmId));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete student");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPassword = (student) => {
    // IMPORTANT: Just display the stored password - never regenerate
    if (!student.plainPassword) {
      setError("Password not available for this student. Please import the student again.");
      return;
    }

    setGeneratedPassword(student.plainPassword);
    setGeneratedPasswordStudent(student.studentName);
    setShowPasswordModal(true);
    setError("");
  };

  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const searchTerm = filterSearch.toLowerCase();
    return (
      student.studentName.toLowerCase().includes(searchTerm) ||
      student.rollNo.toLowerCase().includes(searchTerm) ||
      student.enrollmentNo.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  return (
    <div className="manage-students-page">
      <div className="manage-header">
        <h1>Manage Students</h1>
        <p>View, edit, and delete student records.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="manage-controls">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Filter by division"
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Filter by batch"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Search by name, roll no, or enrollment"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="filter-buttons">
          <button
            className="btn-primary"
            onClick={handleFilterApply}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filters"}
          </button>
          <button
            className="btn-secondary"
            onClick={handleFilterClear}
            disabled={loading}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="manage-table-wrapper">
        <div className="table-info">
          <span className="pill">{filteredStudents.length} students found</span>
        </div>

        {currentStudents.length === 0 ? (
          <div className="empty-state">
            <p>{loading ? "Loading students..." : "No students found."}</p>
          </div>
        ) : (
          <>
            <table className="manage-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Enrollment No</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Batch</th>
                  <th>Division</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student) => (
                  <React.Fragment key={student._id}>
                    {editingId === student._id ? (
                      // Edit mode
                      <tr className="edit-row">
                        <td>
                          <input
                            type="text"
                            value={editData.rollNo || ""}
                            onChange={(e) =>
                              handleEditChange("rollNo", e.target.value)
                            }
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.enrollmentNo || ""}
                            onChange={(e) =>
                              handleEditChange("enrollmentNo", e.target.value)
                            }
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.studentName || ""}
                            onChange={(e) =>
                              handleEditChange("studentName", e.target.value)
                            }
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <span className="credential-display">{editData.username || "-"}</span>
                          {editData.username && (
                            <button
                              className="btn-regenerate"
                              onClick={() => handleViewPassword(editData)}
                              disabled={loading}
                              title="View password"
                            >
                              👁️
                            </button>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.batch || ""}
                            onChange={(e) =>
                              handleEditChange("batch", e.target.value)
                            }
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.division || ""}
                            onChange={(e) =>
                              handleEditChange("division", e.target.value)
                            }
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-save"
                              onClick={handleEditSave}
                              disabled={loading}
                            >
                              Save
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={handleEditCancel}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // View mode
                      <tr className="view-row">
                        <td>{student.rollNo}</td>
                        <td>{student.enrollmentNo}</td>
                        <td>{student.studentName}</td>
                        <td className="credential-cell">
                          <span className="credential-display">{student.username || "-"}</span>
                          {student.username && (
                            <button
                              className="btn-regenerate"
                              onClick={() => handleViewPassword(student)}
                              disabled={loading}
                              title="View password"
                            >
                              👁️
                            </button>
                          )}
                        </td>
                        <td>{student.batch}</td>
                        <td>{student.division || "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditStart(student)}
                              disabled={loading || editingId !== null}
                              title="Edit student"
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() =>
                                handleDeleteConfirm(student)
                              }
                              disabled={
                                loading ||
                                editingId !== null ||
                                deleteConfirmId !== null
                              }
                              title="Delete student"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-nav"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-nav"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete student <strong>{deleteConfirmName}</strong>?
            </p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button
                className="btn-delete"
                onClick={handleDeleteConfirmed}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
              <button
                className="btn-cancel"
                onClick={handleDeleteCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Generated Password</h2>
            <p>
              New password for <strong>{generatedPasswordStudent}</strong>:
            </p>
            <div className="password-display">
              <code>{generatedPassword}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  alert("Password copied to clipboard!");
                }}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-primary"
                onClick={() => setShowPasswordModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}    </div>
  );
};

export default ManageStudents;