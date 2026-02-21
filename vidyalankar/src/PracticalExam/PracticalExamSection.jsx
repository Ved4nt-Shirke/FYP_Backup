import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./PracticalExamSection.css";

const PracticalExamSection = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [cianns, setCianns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseWiseExams, setCourseWiseExams] = useState({});

  // Fetch departments from CIANNs
  useEffect(() => {
    fetchCianns();
  }, []);

  const fetchCianns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(config.cianns, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch CIANNs");

      const data = await response.json();
      const ciannList = Array.isArray(data) ? data : data?.cianns || [];
      setCianns(ciannList);

      // Extract unique departments
      const uniqueDepts = [];
      const deptMap = new Map();

      ciannList.forEach((ciann) => {
        if (
          ciann.department &&
          ciann.department._id &&
          !deptMap.has(ciann.department._id)
        ) {
          deptMap.set(ciann.department._id, {
            _id: ciann.department._id,
            name: ciann.department.name,
            code: ciann.department.code,
          });
        }
      });

      setDepartments(Array.from(deptMap.values()));
      if (deptMap.size > 0) {
        const firstDept = Array.from(deptMap.values())[0];
        setSelectedDepartment(firstDept._id);
        fetchCoursesForDepartment(firstDept._id);
      }
    } catch (err) {
      console.error("Error fetching CIANNs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesForDepartment = async (deptId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/courses/by-department?departmentId=${deptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0]._id);
        fetchPracticalExamsForDepartment(deptId);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchPracticalExamsForDepartment = async (deptId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${config.apiBaseUrl}/practical-exams/by-department/${deptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch exams");

      const data = await response.json();
      setCourseWiseExams(data.exams || {});
    } catch (err) {
      console.error("Error fetching practical exams:", err);
    }
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDepartment(deptId);
    setSelectedCourse("");
    setCourses([]);
    fetchCoursesForDepartment(deptId);
  };

  const handleNavigate = (action) => {
    if (!selectedDepartment) {
      alert("Please select a department first");
      return;
    }
    if (!selectedCourse && action !== "manage") {
      alert("Please select a course first");
      return;
    }

    const params = new URLSearchParams({
      departmentId: selectedDepartment,
      courseId: selectedCourse,
    });

    switch (action) {
      case "add":
        navigate(`/faculty/practical-exams/add?${params}`);
        break;
      case "manage":
        navigate(
          `/faculty/practical-exams/manage?departmentId=${selectedDepartment}`,
        );
        break;
      case "status":
        navigate(
          `/faculty/practical-exams/status?departmentId=${selectedDepartment}`,
        );
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <div className="practical-exam-loading">Loading departments...</div>;
  }

  return (
    <div className="practical-exam-section">
      <div className="section-header">
        <h1>Practical Exam Management</h1>
        <p>
          Organize practical exams by department and course (CO1K, CO2K, etc.)
        </p>
      </div>

      <div className="section-controls">
        <div className="control-group">
          <label htmlFor="department">Select Department:</label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="form-control"
          >
            <option value="">Choose Department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {selectedDepartment && courses.length > 0 && (
          <div className="control-group">
            <label htmlFor="course">Select Course:</label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-control"
            >
              <option value="">Choose Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="section-actions">
        <button
          className="btn btn-primary"
          onClick={() => handleNavigate("add")}
          disabled={!selectedDepartment || !selectedCourse}
        >
          <i className="bi bi-plus-circle"></i> Add Practical Exam
        </button>
        <button
          className="btn btn-info"
          onClick={() => handleNavigate("manage")}
          disabled={!selectedDepartment}
        >
          <i className="bi bi-list-check"></i> Manage Exams
        </button>
        <button
          className="btn btn-warning"
          onClick={() => handleNavigate("status")}
          disabled={!selectedDepartment}
        >
          <i className="bi bi-eye-slash"></i> Enable/Disable
        </button>
      </div>

      {selectedDepartment && Object.keys(courseWiseExams).length > 0 && (
        <div className="course-wise-exams">
          <h2>Practical Exams by Course</h2>
          <div className="exams-grid">
            {Object.entries(courseWiseExams).map(([courseCode, exams]) => (
              <div key={courseCode} className="course-card">
                <h3>{courseCode}</h3>
                <ul>
                  {exams.map((exam) => (
                    <li key={exam._id}>
                      <span className="exam-title">{exam.title}</span>
                      <small>{exam.batch}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalExamSection;
