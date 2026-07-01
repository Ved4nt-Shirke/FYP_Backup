import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./PracticalExamSection.css";

const PracticalExamSection = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [Ciaans, setCiaans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseWiseExams, setCourseWiseExams] = useState({});

  // Fetch departments from Ciaans
  useEffect(() => {
    fetchCiaans();
  }, []);

  const fetchCiaans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(config.Ciaans, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch Ciaans");

      const data = await response.json();
      const CiaanList = Array.isArray(data) ? data : data?.Ciaans || [];
      setCiaans(CiaanList);

      // Extract unique departments
      const uniqueDepts = [];
      const deptMap = new Map();

      CiaanList.forEach((Ciaan) => {
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
      if (deptMap.size > 0) {
        const firstDept = Array.from(deptMap.values())[0];
        setSelectedDepartment(firstDept._id);
        fetchCoursesForDepartment(firstDept._id);
      }
    } catch (err) {
      console.error("Error fetching Ciaans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesForDepartment = async (deptId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(config.catalog.courses(deptId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      const mappedCourses = (data.courses || []).map((course) => ({
        ...course,
        code: course.courseCode || course.code || "-",
        name: course.name || `Semester ${course.semester || ""}`.trim(),
      }));

      setCourses(mappedCourses);

      if (mappedCourses.length > 0) {
        setSelectedCourse(mappedCourses[0]._id);
        fetchPracticalExamsForDepartment(mappedCourses, token);
      } else {
        setCourseWiseExams({});
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      setCourseWiseExams({});
    }
  };

  const fetchPracticalExamsForDepartment = async (courseList, authToken) => {
    try {
      if (!Array.isArray(courseList) || courseList.length === 0) {
        setCourseWiseExams({});
        return;
      }

      const token = authToken || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [examsResponse, ...divisionResponses] = await Promise.all([
        fetch(`${config.apiBaseUrl}/practical-exams`, { headers }),
        ...courseList.map((course) =>
          fetch(config.catalog.divisions(course._id), { headers }),
        ),
      ]);

      if (!examsResponse.ok) throw new Error("Failed to fetch exams");

      const examsData = await examsResponse.json();
      const allExams = examsData?.success ? examsData.practicalExams || [] : [];

      const divisionsByCourseId = {};
      for (let i = 0; i < courseList.length; i += 1) {
        const res = divisionResponses[i];
        if (!res?.ok) {
          divisionsByCourseId[courseList[i]._id] = [];
          continue;
        }
        const payload = await res.json();
        divisionsByCourseId[courseList[i]._id] = (payload.divisions || []).map(
          (division) => division.name || "",
        );
      }

      const grouped = {};
      courseList.forEach((course) => {
        const courseCode = course.code || "-";
        const courseDivisions = divisionsByCourseId[course._id] || [];
        const lowerCaseDivisions = new Set(
          courseDivisions.map((d) => String(d).toLowerCase()),
        );

        grouped[courseCode] = allExams.filter((exam) => {
          const examDivisions = Array.isArray(exam.divisions)
            ? exam.divisions
            : [];
          return examDivisions.some((division) =>
            lowerCaseDivisions.has(String(division).toLowerCase()),
          );
        });
      });

      setCourseWiseExams(grouped);
    } catch (err) {
      console.error("Error fetching practical exams:", err);
      setCourseWiseExams({});
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
    return (
      <div className="practical-exam-loading">
        Loading practical exam workspace...
      </div>
    );
  }

  const selectedCourseData = courses.find(
    (course) => course._id === selectedCourse,
  );
  const selectedCourseExamCount = selectedCourseData?.code
    ? courseWiseExams[selectedCourseData.code]?.length || 0
    : 0;

  const flowSteps = [
    {
      id: 1,
      title: "Choose Department",
      done: Boolean(selectedDepartment),
    },
    {
      id: 2,
      title: "Choose Course",
      done: Boolean(selectedCourse),
    },
    {
      id: 3,
      title: "Take Action",
      done: Boolean(selectedDepartment && selectedCourse),
    },
  ];

  return (
    <div className="practical-exam-section">
      <div className="practical-hero">
        <div>
          <h1>Practical Exam Workspace</h1>
          <p>
            Create, manage, and publish practical exams with a clear 3-step
            flow.
          </p>
        </div>
        <div className="practical-hero-meta">
          <div>
            <strong>{departments.length}</strong>
            <span>Departments</span>
          </div>
          <div>
            <strong>{courses.length}</strong>
            <span>Courses</span>
          </div>
          <div>
            <strong>{selectedCourseExamCount}</strong>
            <span>Exams in selected course</span>
          </div>
        </div>
      </div>

      <div className="practical-flow-steps">
        {flowSteps.map((step) => (
          <div
            key={step.id}
            className={`flow-step ${step.done ? "is-done" : ""}`}
          >
            <span className="flow-index">{step.id}</span>
            <span className="flow-title">{step.title}</span>
          </div>
        ))}
      </div>

      <div className="practical-section-card">
        <h2 className="section-card-title">Step 1 & 2: Academic Context</h2>
        <div className="section-controls">
          <div className="control-group">
            <label htmlFor="department">Department</label>
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

          <div className="control-group">
            <label htmlFor="course">Course</label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="form-control"
              disabled={!selectedDepartment || courses.length === 0}
            >
              <option value="">Choose Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="practical-section-card">
        <h2 className="section-card-title">Step 3: Choose Action</h2>
        <div className="section-actions-grid">
          <button
            className="action-card action-add"
            onClick={() => handleNavigate("add")}
            disabled={!selectedDepartment || !selectedCourse}
          >
            <i className="bi bi-plus-circle"></i>
            <span>Add Practical Exam</span>
            <small>
              Create a new exam for the selected course and division.
            </small>
          </button>

          <button
            className="action-card action-manage"
            onClick={() => handleNavigate("manage")}
            disabled={!selectedDepartment}
          >
            <i className="bi bi-list-check"></i>
            <span>Manage Exams</span>
            <small>Edit exam structure, questions, and exam metadata.</small>
          </button>

          <button
            className="action-card action-status"
            onClick={() => handleNavigate("status")}
            disabled={!selectedDepartment}
          >
            <i className="bi bi-eye-slash"></i>
            <span>Enable or Disable</span>
            <small>Control exam visibility for students instantly.</small>
          </button>
        </div>
      </div>

      {selectedDepartment && Object.keys(courseWiseExams).length > 0 && (
        <div className="practical-section-card">
          <h2 className="section-card-title">
            Existing Practical Exams by Course
          </h2>
          <div className="exams-grid">
            {Object.entries(courseWiseExams).map(([courseCode, exams]) => (
              <div key={courseCode} className="course-card">
                <div className="course-card-head">
                  <h3>{courseCode}</h3>
                  <span>{exams.length} exam(s)</span>
                </div>
                <ul>
                  {exams.slice(0, 4).map((exam) => (
                    <li key={exam._id}>
                      <span className="exam-title">{exam.title}</span>
                      <small>{exam.batch}</small>
                    </li>
                  ))}
                </ul>
                {exams.length > 4 && (
                  <p className="course-more">+{exams.length - 4} more</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticalExamSection;
