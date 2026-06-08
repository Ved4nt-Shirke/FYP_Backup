import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { showErrorAlert, showSuccessAlert } from "../../utils/alertUtils";
import { config } from "../../config/api";
import CourseDetailsModal from "./CourseDetailsModal";
import "./SubjectsView.css";

const SubjectsView = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    departmentId: "",
    courseId: "",
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  // Course Details Modal State
  const [selectedSubjectForDetails, setSelectedSubjectForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (subject) => {
    setSelectedSubjectForDetails(subject);
    setIsDetailsModalOpen(true);
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      showErrorAlert("Failed to load departments");
    }
  };

  const fetchCourses = async (departmentId) => {
    if (!departmentId) {
      setCourses([]);
      setSubjects([]);
      return;
    }

    try {
      const response = await axios.get(
        config.courses.listByDepartment(departmentId),
      );
      if (response.data.success) {
        setCourses(response.data.courses || []);
        setSubjects([]);
      }
    } catch (error) {
      showErrorAlert("Failed to load courses");
    }
  };

  const fetchSubjects = async () => {
    if (!filters.departmentId || !filters.courseId) {
      showErrorAlert("Please select both department and course");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(config.subjects.list, {
        params: {
          departmentId: filters.departmentId,
          courseId: filters.courseId,
        },
      });
      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      }
    } catch (error) {
      showErrorAlert("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setFilters({ departmentId, courseId: "" });
    fetchCourses(departmentId);
  };

  const handleCourseChange = (e) => {
    setFilters({ ...filters, courseId: e.target.value });
  };

  const handleViewSubjects = () => {
    fetchSubjects();
  };

  const handleClearFilters = () => {
    setFilters({ departmentId: "", courseId: "" });
    setSubjects([]);
    setCourses([]);
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm("Delete this subject?")) {
      return;
    }

    try {
      const response = await axios.delete(config.subjects.delete(subjectId));
      if (response.data.success) {
        showSuccessAlert("Subject deleted successfully");
        setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
      } else {
        showErrorAlert(response.data.message || "Failed to delete subject");
      }
    } catch (error) {
      showErrorAlert("Failed to delete subject");
    }
  };

  const handleShowDeleteAllModal = () => {
    if (!filters.courseId) {
      showErrorAlert("Please select a course first");
      return;
    }
    setShowPasswordModal(true);
    setAdminPassword("");
  };

  const handleDeleteAll = async () => {
    if (!adminPassword.trim()) {
      showErrorAlert("Please enter admin password");
      return;
    }

    try {
      setDeletingAll(true);
      const response = await axios.post(config.subjects.deleteAll, {
        courseId: filters.courseId,
        adminPassword: adminPassword,
      });

      if (response.data.success) {
        showSuccessAlert(
          `Deleted ${response.data.deletedCount || 0} subjects successfully`,
        );
        setSubjects([]);
        setShowPasswordModal(false);
        setAdminPassword("");
      } else {
        showErrorAlert(response.data.message || "Failed to delete subjects");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        showErrorAlert("Invalid admin password");
      } else {
        showErrorAlert("Failed to delete subjects");
      }
    } finally {
      setDeletingAll(false);
    }
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setAdminPassword("");
  };

  const selectedDept = departments.find((d) => d._id === filters.departmentId);
  const selectedCourse = courses.find((c) => c._id === filters.courseId);

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>View Subjects</h2>
          <p>Filter and manage subjects by department and course</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => navigate("/admin-dashboard")}
        >
          <i className="bi bi-house-door"></i>
          Dashboard
        </button>
      </div>

      <div className="subjects-filter-card">
        <div className="form-header-row">
          <div>
            <h3>Filter Subjects</h3>
            <p>Select department and course to view subjects</p>
          </div>
        </div>

        <div className="filter-grid">
          <div className="form-field">
            <label>Department</label>
            <select
              value={filters.departmentId}
              onChange={handleDepartmentChange}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Course</label>
            <select
              value={filters.courseId}
              onChange={handleCourseChange}
              disabled={!filters.departmentId}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode} (Sem {course.semester}, Scheme{" "}
                  {course.scheme})
                </option>
              ))}
            </select>
          </div>
        </div>

        {filters.departmentId &&
          filters.courseId &&
          selectedDept &&
          selectedCourse && (
            <div className="filter-summary">
              <div className="summary-badge">
                <span className="summary-label">Department:</span>
                <span className="summary-value">{selectedDept.name}</span>
              </div>
              <div className="summary-badge">
                <span className="summary-label">Course:</span>
                <span className="summary-value">
                  {selectedCourse.courseCode}
                </span>
              </div>
              <div className="summary-badge">
                <span className="summary-label">Semester:</span>
                <span className="summary-value">{selectedCourse.semester}</span>
              </div>
              <div className="summary-badge">
                <span className="summary-label">Scheme:</span>
                <span className="summary-value">{selectedCourse.scheme}</span>
              </div>
            </div>
          )}

        <div className="filter-actions">
          <button className="btn-primary" onClick={handleViewSubjects}>
            <i className="bi bi-search"></i>
            View Subjects
          </button>
          <button className="btn-secondary" onClick={handleClearFilters}>
            <i className="bi bi-arrow-counterclockwise"></i>
            Clear Filters
          </button>
          <button
            className="btn-tertiary"
            onClick={() => navigate("/admin/subjects")}
          >
            <i className="bi bi-plus-circle"></i>
            Add New Subject
          </button>
          <button
            className="btn-danger"
            onClick={handleShowDeleteAllModal}
            disabled={subjects.length === 0}
          >
            <i className="bi bi-trash"></i>
            Delete All Subjects
          </button>
        </div>
      </div>

      <div className="subject-table-card">
        <div className="table-header">
          <h3>Subjects List</h3>
          <span className="table-count">{subjects.length} total</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="bi bi-journal-text"></i>
            </div>
            <h3>No Subjects Found</h3>
            <p>
              {filters.departmentId && filters.courseId
                ? "No subjects for this course. Click 'Add New Subject' to create one."
                : "Select a department and course to view subjects."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Course Code</th>
                  <th>Semester</th>
                  <th>Course Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr
                    key={subject._id}
                    onClick={() => handleOpenDetails(subject)}
                    style={{ cursor: "pointer" }}
                    title="Click row to manage course details & CO mapping"
                  >
                    <td>{subject.name}</td>
                    <td className="code-cell">{subject.code}</td>
                    <td>
                      {subject.departmentId?.name || "-"}
                      {subject.departmentId?.code
                        ? ` (${subject.departmentId.code})`
                        : ""}
                    </td>
                    <td>{subject.courseId?.courseCode || "-"}</td>
                    <td>{subject.courseId?.semester || "-"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions">
                        {subject.hasCourseDetails ? (
                          <>
                            <button
                              className="btn-ghost"
                              onClick={() => handleOpenDetails(subject)}
                            >
                              Edit Details
                            </button>
                            <button
                              className="btn-tertiary"
                              onClick={() => navigate(`/admin/course-details-view/${subject._id}`)}
                            >
                              View Format
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-primary"
                            style={{ padding: "6px 12px" }}
                            onClick={() => handleOpenDetails(subject)}
                          >
                            Add Details
                          </button>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="table-actions">
                        <button
                          className="btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/admin/subjects", {
                              state: { editSubject: subject },
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger-outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(subject._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete All Subjects</h3>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                disabled={deletingAll}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="warning-text">
                <i className="bi bi-exclamation-triangle"></i>
                You are about to delete all subjects for this course. This
                action cannot be undone.
              </p>

              <div className="form-field">
                <label>Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  disabled={deletingAll}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !deletingAll) {
                      handleDeleteAll();
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCloseModal}
                disabled={deletingAll}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAll}
                disabled={deletingAll || !adminPassword.trim()}
              >
                {deletingAll ? "Deleting..." : "Delete All Subjects"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDetailsModalOpen && (
        <CourseDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedSubjectForDetails(null);
          }}
          subject={selectedSubjectForDetails}
          onSaveSuccess={fetchSubjects}
        />
      )}
    </div>
  );
};

export default SubjectsView;
