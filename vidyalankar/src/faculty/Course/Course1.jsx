import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./CourseSectionShared.css";

const CourseForm = () => {
  const navigate = useNavigate();

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  // Ciaan data
  const [Ciaans, setCiaans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Ciaans on mount
  useEffect(() => {
    fetchCiaans();
  }, []);

  // Extract unique departments from Ciaans
  useEffect(() => {
    if (Ciaans.length > 0) {
      const uniqueDepts = [];
      const deptMap = new Map();

      Ciaans.forEach((Ciaan) => {
        if (
          Ciaan.department &&
          Ciaan.department._id &&
          !deptMap.has(Ciaan.department._id)
        ) {
          deptMap.set(Ciaan.department._id, {
            _id: Ciaan.department._id,
            name: Ciaan.department.name,
            code: Ciaan.department.code,
          });
        }
      });

      setDepartments(Array.from(deptMap.values()));
    }
  }, [Ciaans]);

  // Filter courses when department changes
  useEffect(() => {
    if (selectedDepartment && Ciaans.length > 0) {
      const deptCiaans = Ciaans.filter(
        (c) => c.department?._id === selectedDepartment,
      );
      const uniqueCourses = [];
      const courseMap = new Map();

      deptCiaans.forEach((Ciaan) => {
        const key = `${Ciaan.semester}-${Ciaan.class}`;
        if (!courseMap.has(key)) {
          courseMap.set(key, {
            _id: key,
            semester: Ciaan.semester,
            class: Ciaan.class,
            semesterType: Ciaan.semesterType,
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
  }, [selectedDepartment, Ciaans]);

  // Filter subjects when course changes
  useEffect(() => {
    if (selectedDepartment && Ciaans.length > 0) {
      let filteredCiaans = Ciaans.filter(
        (c) => c.department?._id === selectedDepartment,
      );

      if (selectedCourse) {
        filteredCiaans = filteredCiaans.filter(
          (c) => `${c.semester}-${c.class}` === selectedCourse,
        );
      }

      const uniqueSubjects = [];
      const subjectMap = new Map();

      filteredCiaans.forEach((Ciaan) => {
        if (
          Ciaan.subject &&
          Ciaan.subject._id &&
          !subjectMap.has(Ciaan.subject._id)
        ) {
          subjectMap.set(Ciaan.subject._id, {
            _id: Ciaan.subject._id,
            name: Ciaan.subject.name,
            code: Ciaan.subject.code,
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
  }, [selectedCourse, selectedDepartment, Ciaans]);

  const fetchCiaans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const res = await fetch(config.Ciaans, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch Ciaans");
      }

      const data = await res.json();
      setCiaans(data || []);
    } catch (err) {
      console.error("Error fetching Ciaans:", err);
      setError("Failed to load your courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDepartment || !selectedCourse || !selectedSubject) {
      alert("Please select all fields before submitting.");
      return;
    }

    const selectedDept = departments.find((d) => d._id === selectedDepartment);
    const selectedCourseObj = courses.find((c) => c._id === selectedCourse);
    const selectedSubj = subjects.find((s) => s._id === selectedSubject);

    // Navigate to Course2 with state
    const queryParams = new URLSearchParams({
      program: selectedDept.name,
      className: `${selectedCourseObj.class}`,
      course: selectedSubj.name,
    }).toString();
    navigate(`/course2?${queryParams}`);
  };

  return (
    <div className="course-form-container">
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
        <h1 style={{ margin: 0 }}>Select Course To Add Experiments</h1>
      </div>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={loading}
          >
            <option value="">--- Select Department ---</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Course (Semester)</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedDepartment || loading}
          >
            <option value="">--- Select Course ---</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                Semester {course.semester} - {course.class}
                {course.scheme})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedDepartment || loading}
          >
            <option value="">--- Select Subject ---</option>
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

export default CourseForm;
