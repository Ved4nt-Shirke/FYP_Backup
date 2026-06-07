import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import Header from "../basic/Header";
import "./PracticalBatchDistribution.css";

const PracticalBatchDistribution = () => {
  const navigate = useNavigate();

  // State for cascading filters
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [students, setStudents] = useState([]);

  // Selected values
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState(""); // Store division ID
  const [courseInfo, setCourseInfo] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate batch options (academic years)
  const generateBatchOptions = () => {
    const currentYear = new Date().getFullYear();
    const batches = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      batches.push(`${startYear}-${endYear.toString().slice(-2)}`);
    }
    return batches;
  };

  const batchOptions = generateBatchOptions();

  // Fetch departments from admin-created catalog on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please log in to access this feature.");
          return;
        }

        console.log(
          "Fetching departments from catalog:",
          config.catalog.departments,
        );
        const res = await fetch(config.catalog.departments, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Departments response:", data);

        if (data.success && Array.isArray(data.departments)) {
          console.log("Number of departments:", data.departments.length);
          setDepartments(data.departments);

          if (data.departments.length === 0) {
            setError(
              "No departments found. Please contact admin to create departments.",
            );
          }
        } else {
          setError("Invalid data format received from server.");
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError(`Failed to fetch departments: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch courses from admin-created catalog when department changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedDepartment) {
        setCourses([]);
        setDivisions([]);
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        console.log("=== FETCHING COURSES ===");
        console.log("Selected Department ID:", selectedDepartment);
        console.log(
          "Fetching from:",
          config.catalog.courses(selectedDepartment),
        );

        const res = await fetch(config.catalog.courses(selectedDepartment), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Courses response:", data);

        if (data.success && Array.isArray(data.courses)) {
          console.log("Number of courses found:", data.courses.length);
          setCourses(data.courses);

          if (data.courses.length === 0) {
            setError(
              "No courses found for this department. Please contact admin.",
            );
          }
        } else {
          setError("Invalid courses data format.");
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to fetch courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedDepartment]);

  // Fetch divisions from admin-created catalog when course changes
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!selectedCourse) {
        setDivisions([]);
        setStudents([]);
        setCourseInfo(null);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        console.log("=== FETCHING DIVISIONS ===");
        console.log("Selected Course ID:", selectedCourse);
        console.log("Fetching from:", config.catalog.divisions(selectedCourse));

        const res = await fetch(config.catalog.divisions(selectedCourse), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Divisions response:", data);

        if (data.success && Array.isArray(data.divisions)) {
          console.log("Number of divisions found:", data.divisions.length);
          setDivisions(data.divisions);

          if (data.divisions.length === 0) {
            setError(
              "No divisions found for this course. Please contact admin.",
            );
          }

          // Fetch course details from the courses array
          const selectedCourseData = courses.find(
            (c) => c._id === selectedCourse,
          );
          if (selectedCourseData) {
            setCourseInfo({
              name: `${selectedCourseData.courseCode} - Semester ${selectedCourseData.semester}`,
              code: selectedCourseData.courseCode || "",
              courseCode: selectedCourseData.courseCode || "",
              semester: selectedCourseData.semester || "",
            });
          }
        } else {
          setError("Invalid divisions data format.");
        }
      } catch (err) {
        console.error("Error fetching divisions:", err);
        setError("Failed to fetch divisions");
        setDivisions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, [selectedCourse, courses]);

  // Fetch students when division changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDivision || !selectedCourse) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.append("divisionId", selectedDivision);
        params.append("courseId", selectedCourse);
        if (selectedBatch) {
          params.append("batch", selectedBatch);
        }

        const token = localStorage.getItem("token");
        const url = `${config.students}?${params.toString()}`;
        console.log("Fetching students from:", url);
        console.log("Parameters:", {
          divisionId: selectedDivision,
          courseId: selectedCourse,
          batch: selectedBatch || "not specified",
        });

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("Students response:", data);

        let studentList = [];
        if (Array.isArray(data)) {
          studentList = data;
        } else if (data.students && Array.isArray(data.students)) {
          studentList = data.students;
        } else if (data.data && Array.isArray(data.data)) {
          studentList = data.data;
        }

        console.log("Found students:", studentList);
        setStudents(studentList);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch students");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedDivision, selectedCourse, selectedBatch]);

  // Divide students into batches
  const batchStudents = () => {
    if (students.length === 0) {
      return { B1: [], B2: [], B3: [] };
    }

    const batchSize = Math.ceil(students.length / 3);
    const batches = {
      B1: students.slice(0, batchSize),
      B2: students.slice(batchSize, batchSize * 2),
      B3: students.slice(batchSize * 2),
    };

    return batches;
  };

  const batches = batchStudents();
  const totalStudents = students.length;

  // Helper to get division display name
  const getDivisionName = () => {
    const div = divisions.find((d) => (d._id || d) === selectedDivision);
    return div ? div.name || div : selectedDivision;
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="batch-distribution-container">
        {/* Loading indicator at top */}
        {loading && !departments.length && (
          <div className="loading-state">
            <p>Loading your courses and departments...</p>
          </div>
        )}

        {/* Error display at top */}
        {error && !loading && (
          <div className="batch-selection-section">
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="batch-selection-section">
          <h2>Setup Practical Batches</h2>

          <div className="selection-form">
            {/* Batch/Year Selection */}
            <div className="form-group">
              <label htmlFor="batch-select">
                <strong>Select Batch (Academic Year)</strong>
              </label>
              <select
                id="batch-select"
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setStudents([]);
                }}
                className="form-select"
              >
                <option value="">-- Choose Batch --</option>
                {batchOptions.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div className="form-group">
              <label htmlFor="dept-select">
                <strong>Select Department</strong>
              </label>
              <select
                id="dept-select"
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedCourse("");
                  setSelectedDivision("");
                }}
                className="form-select"
              >
                <option value="">-- Choose Department --</option>
                {loading && departments.length === 0 ? (
                  <option disabled>Loading...</option>
                ) : departments.length === 0 ? (
                  <option disabled>No departments available</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Course Selection */}
            <div className="form-group">
              <label htmlFor="course-select">
                <strong>Select Course</strong>
              </label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedDivision("");
                }}
                disabled={!selectedDepartment}
                className="form-select"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - Sem {course.semester}
                  </option>
                ))}
              </select>
            </div>

            {/* Division Selection */}
            <div className="form-group">
              <label htmlFor="division-select">
                <strong>Select Division</strong>
              </label>
              <select
                id="division-select"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                disabled={!selectedCourse}
                className="form-select"
              >
                <option value="">-- Choose Division --</option>
                {divisions.map((div) => (
                  <option key={div._id || div} value={div._id || div}>
                    Division {div.name || div}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Info Card */}
        {selectedDivision && courseInfo && (
          <div className="course-info-card">
            <div className="course-header">
              <div className="course-icon">📚</div>
              <div className="course-details">
                <h3>{courseInfo.name}</h3>
                <p className="course-code">
                  {courseInfo.code && `Code: ${courseInfo.code}`}
                </p>
                {selectedBatch && (
                  <p className="course-batch">Batch: {selectedBatch}</p>
                )}
              </div>
            </div>
            <div className="division-badge">Division: {getDivisionName()}</div>
          </div>
        )}

        {/* Batches Display */}
        {selectedDivision && totalStudents > 0 && (
          <div className="batches-section">
            <div className="section-header">
              <h3>Student Distribution</h3>
              <span className="total-badge">
                Total: {totalStudents} Students
              </span>
            </div>

            <div className="batches-grid">
              {["B1", "B2", "B3"].map((batchName) => (
                <div key={batchName} className="batch-card">
                  <div className="batch-header">
                    <h4>{batchName}</h4>
                    <span className="batch-count">
                      {batches[batchName].length} Students
                    </span>
                  </div>

                  <div className="students-list">
                    {batches[batchName].length === 0 ? (
                      <p className="no-students">No students in this batch</p>
                    ) : (
                      <table className="batch-table">
                        <thead>
                          <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            <th>Enrollment No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batches[batchName].map((student, index) => (
                            <tr key={index}>
                              <td>{student.rollNo}</td>
                              <td>{student.studentName}</td>
                              <td>{student.enrollmentNo || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedDivision && totalStudents === 0 && !loading && (
          <div className="empty-state">
            <p>No students found for the selected division.</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <p>Loading data...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PracticalBatchDistribution;
