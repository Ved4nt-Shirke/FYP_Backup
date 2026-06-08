// managechp1.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./CourseSectionShared.css";

const ManageChapters1 = () => {
  const navigate = useNavigate();

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // CIANN data
  const [cianns, setCianns] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch CIANNs on mount
  useEffect(() => {
    fetchCianns();
  }, []);

  // Extract unique departments from CIANNs
  useEffect(() => {
    if (cianns.length > 0) {
      const uniqueDepts = [];
      const deptMap = new Map();

      cianns.forEach((ciann) => {
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
    }
  }, [cianns]);

  // Filter courses when department changes
  useEffect(() => {
    if (selectedDepartment && cianns.length > 0) {
      const deptCianns = cianns.filter(
        (c) => c.department?._id === selectedDepartment,
      );
      const uniqueCourses = [];
      const courseMap = new Map();

      deptCianns.forEach((ciann) => {
        const key = `${ciann.semester}-${ciann.class}`;
        if (!courseMap.has(key)) {
          courseMap.set(key, {
            _id: key,
            semester: ciann.semester,
            class: ciann.class,
            semesterType: ciann.semesterType,
          });
        }
      });

      setCourses(Array.from(courseMap.values()));
      setSelectedCourse("");
      setSelectedSubject("");
    } else {
      setCourses([]);
      setSubjects([]);
    }
  }, [selectedDepartment, cianns]);

  // Filter subjects when course changes
  useEffect(() => {
    if (selectedDepartment && cianns.length > 0) {
      let filteredCianns = cianns.filter(
        (c) => c.department?._id === selectedDepartment,
      );

      if (selectedCourse) {
        filteredCianns = filteredCianns.filter(
          (c) => `${c.semester}-${c.class}` === selectedCourse,
        );
      }

      const uniqueSubjects = [];
      const subjectMap = new Map();

      filteredCianns.forEach((ciann) => {
        if (
          ciann.subject &&
          ciann.subject._id &&
          !subjectMap.has(ciann.subject._id)
        ) {
          subjectMap.set(ciann.subject._id, {
            _id: ciann.subject._id,
            name: ciann.subject.name,
            code: ciann.subject.code,
          });
        }
      });

      setSubjects(Array.from(subjectMap.values()));
      if (selectedCourse) {
        setSelectedSubject("");
      }
    } else {
      setSubjects([]);
    }
  }, [selectedCourse, selectedDepartment, cianns]);

  const fetchCianns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const res = await fetch(config.cianns, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch CIANNs");
      }

      const data = await res.json();
      setCianns(data || []);
    } catch (err) {
      console.error("Error fetching CIANNs:", err);
      setError("Failed to load your courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedDepartment || !selectedCourse || !selectedSubject) {
      alert(
        "Please select a department, course, and subject before submitting.",
      );
      return;
    }

    const selectedDept = departments.find((d) => d._id === selectedDepartment);
    const selectedCourseObj = courses.find((c) => c._id === selectedCourse);
    const selectedSubj = subjects.find((s) => s._id === selectedSubject);

    // Pass the selected data to the next route using the state property
    navigate("/add-chapters", {
      state: {
        program: selectedDept.name,
        className: `${selectedCourseObj.class}`,
        course: selectedSubj.name,
        // Also pass IDs for future use
        departmentId: selectedDept._id,
        courseId: selectedCourse,
        subjectId: selectedSubj._id,
      },
    });
  };

  return (
    <div className="manage-chapters-container">
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{
            background: "#64748b",
            border: "1px solid #475569",
            color: "#fff",
            marginRight: "15px",
            padding: "8px 16px",
            borderRadius: "6px"
          }}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>
        <h2 className="page-title" style={{ margin: 0 }}>Select Course To Add Chapters</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="chapter-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="department-select">Select Department</label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="department-select"
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
          <label htmlFor="course-select">Select Course (Semester)</label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedDepartment || loading}
          >
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                Semester {course.semester} - {course.class}
                {course.scheme})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject-select">Select Subject</label>
          <select
            id="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedDepartment || loading}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageChapters1;
