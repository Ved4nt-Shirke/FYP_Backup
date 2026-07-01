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
    fetchDepartments();
    
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

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
      showErrorAlert("Failed to load departments");
    }
  };

  const fetchCourses = async (departmentId) => {
    if (!departmentId) {
      setCourses([]);
      return;
    }

    try {
      const response = await axios.get(config.courses.listByDepartment(departmentId));
      if (response.data.success) {
        setCourses(response.data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
      showErrorAlert("Failed to load courses");
    }
  };

  const fetchDivisions = async (courseId) => {
    if (!courseId) {
      setDivisions([]);
      return;
    }

    try {
      const response = await axios.get(config.divisions.listByCourse(courseId));
      if (response.data.success) {
        setDivisions(response.data.divisions || []);
      }
    } catch (error) {
      console.error("Failed to fetch divisions", error);
      showErrorAlert("Failed to load divisions");
    }
  };

  const handleDepartmentChange = async (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedCourse("");
    setSelectedDivision("");
    setSelectedCourseMeta(null);
    setSelectedDivisionMeta(null);
    setCourses([]);
    setDivisions([]);
    
    if (departmentId) {
      await fetchCourses(departmentId);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    setSelectedDivision("");
    setSelectedDivisionMeta(null);
    setDivisions([]);
    
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourseMeta(course);
    
    if (courseId) {
      await fetchDivisions(courseId);
    }
  };

  const handleDivisionChange = (divisionId) => {
    setSelectedDivision(divisionId);
    const division = divisions.find((d) => d._id === divisionId);
    setSelectedDivisionMeta(division);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const mapped = data.map((row) => ({
          rollNo: row["RollNo"] || row["Roll No"] || row["rollNo"] || "",
          enrollmentNo: row["EnrollmentNo"] || row["Enrollment No"] || row["enrollmentNo"] || "",
          studentName: row["StudentName"] || row["Student Name"] || row["studentName"] || row["Name"] || "",
        }));

        const validStudents = mapped.filter(s => s.rollNo && s.enrollmentNo && s.studentName);
        setParsedStudents(validStudents);
        showSuccessAlert(`Parsed ${validStudents.length} students from Excel`);
      } catch (error) {
        console.error("Parse error:", error);
        showErrorAlert("Failed to parse Excel file");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleBulkUpload = async () => {
    if (parsedStudents.length === 0) {
      showErrorAlert("No students to upload");
      return;
    }

    if (!selectedDepartment || !selectedCourse || !selectedDivision) {
      showErrorAlert("Please select Department, Course, and Division");
      return;
    }

    if (!batchYear.trim()) {
      showErrorAlert("Please enter batch year");
      return;
    }

    setLoading(true);
    try {
      // Add department, course, division, and batch to each student
      const studentsWithMetadata = parsedStudents.map(student => ({
        ...student,
        departmentId: selectedDepartment,
        courseId: selectedCourse,
        divisionId: selectedDivision,
        batch: batchYear.trim(),
        // For backward compatibility, add division name
        division: selectedDivisionMeta?.name || "",
      }));

      const response = await axios.post(config.students + "/bulk", {
        students: studentsWithMetadata,
      });

      showSuccessAlert(
        `Uploaded ${response.data.inserted} students. Skipped ${response.data.skipped} duplicates.`
      );
      
      setParsedStudents([]);
      setUploadFileName("");
      setShowUploadModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Upload error:", error);
      showErrorAlert("Failed to upload students: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportTemplate = () => {
    const template = [
      {
        "RollNo": "01",
        "EnrollmentNo": "2024001",
        "StudentName": "John Doe",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_upload_template.xlsx");
  };

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
        <p>Upload and manage student records with department-course-division assignment</p>
        <button
          className="btn-primary upload-btn"
          onClick={() => setShowUploadModal(true)}
          disabled={loading}
        >
          <i className="bi bi-upload"></i> Upload Students
        </button>
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

      {/* Upload Students Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload Student List</h2>
            <p className="modal-subtitle">
              Select department, course, and division, then upload Excel with: RollNo, EnrollmentNo, StudentName
            </p>

            <div className="selection-section">
              <h3>1. Select Department, Course & Division</h3>
              
              <div className="form-group">
                <label>Department / Branch *</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course *</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  disabled={!selectedDepartment || loading}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      Sem {course.semester} - {course.scheme} ({course.courseCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Division *</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  disabled={!selectedCourse || loading}
                >
                  <option value="">-- Select Division --</option>
                  {divisions.map((division) => (
                    <option key={division._id} value={division._id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Batch Year *</label>
                <input
                  type="text"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  placeholder="e.g., 2024"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="upload-section">
              <h3>2. Upload Excel File</h3>
              <div className="form-group">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={!selectedDivision || loading}
                />
                {uploadFileName && <small>Selected: {uploadFileName}</small>}
              </div>
              <button className="btn-secondary" onClick={exportTemplate}>
                Download Template
              </button>
            </div>

            {parsedStudents.length > 0 && (
              <div className="preview-section">
                <h4>Preview ({parsedStudents.length} students)</h4>
                <div className="preview-box">
                  {parsedStudents.slice(0, 5).map((student, idx) => (
                    <div key={idx}>#{idx + 1}: {student.studentName}</div>
                  ))}
                  {parsedStudents.length > 5 && <div>... and {parsedStudents.length - 5} more</div>}
                </div>
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleBulkUpload}
                disabled={!selectedDivision || parsedStudents.length === 0 || loading}
              >
                {loading ? "Uploading..." : "Upload Students"}
              </button>
            </div>
          </div>
        </div>
      )}

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