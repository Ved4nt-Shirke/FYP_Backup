import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { config } from "../config/api";
import "./DepartmentPracticalExams.css";

const DepartmentPracticalExams = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchDepartmentData();
  }, [id, navigate]);

  useEffect(() => {
    if (selectedCourse) {
      fetchExamsForCourse(selectedCourse);
    } else {
      setExams([]);
    }
  }, [selectedCourse]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(config.admin.getDepartmentFaculty(id));
      if (response.data.success) {
        setDepartment(response.data.department);
        fetchCourses();
      } else {
        setError("Failed to fetch department data");
      }
    } catch (err) {
      console.error("Error fetching department:", err);
      setError("Failed to fetch department data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/courses/${id}`);
      if (response.data.success) {
        setCourses(response.data.courses || []);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchExamsForCourse = async (courseId) => {
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/practical-exams/admin/course-exams/${courseId}`,
      );
      if (response.data.success) {
        setExams(response.data.exams || []);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
      setExams([]);
    }
  };

  const handleCopyLink = (publicLink) => {
    const fullLink = `${window.location.origin}/public-exam/${publicLink}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      alert("Link copied to clipboard!");
    });
  };

  const handlePreviewExam = (publicLink) => {
    window.open(`/public-exam/${publicLink}`, "_blank");
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="admin-content">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading practical exams...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="admin-content">
        <div className="empty-state">
          <h3>Department Not Found</h3>
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
            onClick={() => navigate(`/admin/departments/${id}`)}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <h2>Practical Exams - {department.name}</h2>
            <p className="department-code">{department.code}</p>
          </div>
        </div>
      </div>

      {/* Course & Search Selection */}
      <div className="exam-controls">
        <div className="course-selector">
          <label htmlFor="courseSelect">Select Course:</label>
          <select
            id="courseSelect"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="form-select"
          >
            <option value="">-- Choose a course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.courseCode}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="search-box">
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="bi bi-search"></i>
          </div>
        )}
      </div>

      {/* Exams Display */}
      {selectedCourse ? (
        <>
          <div className="exams-header">
            <h3>Available Practical Exams</h3>
            <span className="exam-count">{filteredExams.length} exam(s)</span>
          </div>

          {filteredExams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h4>No Practical Exams</h4>
              <p>
                {searchTerm
                  ? "No exams match your search."
                  : "Faculty members haven't created any practical exams for this course yet."}
              </p>
            </div>
          ) : (
            <div className="exams-grid">
              {filteredExams.map((exam) => (
                <div key={exam._id} className="exam-card">
                  <div className="exam-header">
                    <h4 className="exam-title">{exam.title}</h4>
                    <span className="exam-division">
                      Division {exam.division}
                    </span>
                  </div>

                  <div className="exam-meta">
                    <div className="meta-row">
                      <span className="meta-label">Faculty:</span>
                      <span className="meta-value">{exam.facultyName}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Total Marks:</span>
                      <span className="meta-value">{exam.totalMarks}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Duration:</span>
                      <span className="meta-value">{exam.duration} min</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Questions:</span>
                      <span className="meta-value">
                        {exam.questions?.length || 0}
                      </span>
                    </div>
                  </div>

                  {exam.description && (
                    <p className="exam-description">{exam.description}</p>
                  )}

                  <div className="exam-link-section">
                    <label className="link-label">Public Link:</label>
                    <div className="link-container">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/public-exam/${exam.publicLink}`}
                        className="link-input"
                      />
                      <button
                        className="btn-copy"
                        onClick={() => handleCopyLink(exam.publicLink)}
                        title="Copy link"
                      >
                        <i className="bi bi-clipboard"></i>
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="exam-actions">
                    <button
                      className="btn-preview"
                      onClick={() => handlePreviewExam(exam.publicLink)}
                      title="Preview exam"
                    >
                      <i className="bi bi-eye"></i>
                      Preview
                    </button>
                    <button
                      className="btn-share"
                      onClick={() => handleCopyLink(exam.publicLink)}
                      title="Share link"
                    >
                      <i className="bi bi-share"></i>
                      Share
                    </button>
                  </div>

                  <div className="exam-footer">
                    <span className="exam-date">
                      Created: {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-journals"></i>
          </div>
          <h4>Select a Course</h4>
          <p>Choose a course above to view its practical exams.</p>
        </div>
      )}
    </div>
  );
};

export default DepartmentPracticalExams;
