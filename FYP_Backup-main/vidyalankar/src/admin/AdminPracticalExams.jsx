import React, { useState, useEffect } from "react";
import { config } from "../config/api";
import "./AdminPracticalExams.css";

const AdminPracticalExams = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noExams, setNoExams] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchCourses(selectedDepartment);
      setCourses([]);
      setSelectedCourse("");
      setExams([]);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseExams(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.apiBaseUrl}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments");
    }
  };

  const fetchCourses = async (deptId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.apiBaseUrl}/courses/${deptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseExams = async (courseId) => {
    try {
      setLoading(true);
      setError("");
      setNoExams(false);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/admin/course-exams/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await response.json();
      if (data.success) {
        if (data.exams && data.exams.length > 0) {
          setExams(data.exams);
        } else {
          setNoExams(true);
          setExams([]);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Error fetching course exams:", err);
      setError("Failed to load practical exams");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert("Public link copied to clipboard!");
  };

  return (
    <div className="admin-practical-exams-container">
      <div className="page-header">
        <h1 className="page-title">Practical Exams Management</h1>
        <p className="page-subtitle">
          View all practical exams created by faculty for each course
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Department and Course Selection */}
      <div className="selection-section">
        <div className="selection-row">
          <div className="form-group">
            <label htmlFor="department">Select Department:</label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="form-control"
            >
              <option value="">Choose Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="course">Select Course:</label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-control"
              disabled={!selectedDepartment}
            >
              <option value="">Choose Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exams Display */}
      {selectedCourse && (
        <>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading practical exams...</p>
            </div>
          ) : noExams ? (
            <div className="no-exams-message">
              <div className="empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3>No Practical Exams</h3>
              <p>No practical exams have been created for this course yet.</p>
              <p className="hint">
                Faculty members can create exams from their CIANs.
              </p>
            </div>
          ) : exams.length > 0 ? (
            <div className="exams-grid">
              <div className="exams-header">
                <h2>
                  Practical Exams for{" "}
                  {courses.find((c) => c._id === selectedCourse)?.courseCode}
                </h2>
                <span className="exam-count">
                  {exams.length} exam{exams.length !== 1 ? "s" : ""}
                </span>
              </div>

              {exams.map((examLink, index) => (
                <div key={index} className="exam-card">
                  <div className="exam-card-header">
                    <div className="exam-info">
                      <h3 className="exam-title">{examLink.title}</h3>
                      <p className="exam-faculty">
                        <i className="bi bi-person-circle"></i>{" "}
                        {examLink.facultyName}
                      </p>
                    </div>
                    <div className="exam-division">
                      <span className="division-badge">
                        Division {examLink.division}
                      </span>
                    </div>
                  </div>

                  <div className="exam-card-body">
                    <div className="public-link-section">
                      <label>Public Link for Students:</label>
                      <div className="link-box">
                        <input
                          type="text"
                          value={`${window.location.origin}/public/practical-exam/${examLink.publicLink}`}
                          readOnly
                          className="link-input"
                        />
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/public/practical-exam/${examLink.publicLink}`,
                            )
                          }
                        >
                          <i className="bi bi-clipboard"></i> Copy
                        </button>
                      </div>
                      <p className="link-hint">
                        Share this link directly with students. They'll see a
                        random question each time they refresh.
                      </p>
                    </div>

                    <div className="exam-meta">
                      <div className="meta-item">
                        <i className="bi bi-calendar"></i>
                        <span>
                          {new Date(examLink.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="exam-card-actions">
                    <a
                      href={`/public/practical-exam/${examLink.publicLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-box-arrow-up-right"></i> Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AdminPracticalExams;
