import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { showErrorAlert, showSuccessAlert } from "../../utils/alertUtils";
import { config } from "../../config/api";
import "./DepartmentCourses.css";

const DepartmentCourses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [divisionsByCourse, setDivisionsByCourse] = useState({});
  const [newCourseSemester, setNewCourseSemester] = useState("");
  const [newCourseScheme, setNewCourseScheme] = useState("");
  const [divisionInputs, setDivisionInputs] = useState({});
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingCourseSemester, setEditingCourseSemester] = useState("");
  const [editingCourseScheme, setEditingCourseScheme] = useState("");
  const [editingDivisionId, setEditingDivisionId] = useState(null);
  const [editingDivisionName, setEditingDivisionName] = useState("");
  const [loading, setLoading] = useState(true);

  const schemeOptions = ["K", "I", "J", "C", "E", "F", "G", "H"];

  const buildCourseCode = (semesterValue, schemeValue) => {
    const deptCode = department?.code || "";
    if (!deptCode || !semesterValue || !schemeValue) return "";
    return `${deptCode}${semesterValue}${schemeValue}`.toUpperCase();
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      showErrorAlert("Access denied. Admins only.");
      navigate("/dashboard");
      return;
    }

    fetchDepartment();
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDepartment = async () => {
    try {
      const response = await axios.get(config.admin.departments);
      if (response.data.success) {
        const dept = response.data.departments.find((d) => d._id === id);
        setDepartment(dept || null);
      }
    } catch (error) {
      showErrorAlert("Failed to load department");
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(config.courses.listByDepartment(id));
      if (response.data.success) {
        const fetchedCourses = response.data.courses || [];
        setCourses(fetchedCourses);
        await fetchDivisionsForCourses(fetchedCourses);
      } else {
        showErrorAlert(response.data.message || "Failed to load courses");
      }
    } catch (error) {
      showErrorAlert("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisionsForCourses = async (courseList) => {
    const updates = {};
    await Promise.all(
      courseList.map(async (course) => {
        try {
          const response = await axios.get(
            config.divisions.listByCourse(course._id),
          );
          updates[course._id] = response.data.success
            ? response.data.divisions || []
            : [];
        } catch (error) {
          updates[course._id] = [];
        }
      }),
    );
    setDivisionsByCourse(updates);
  };

  const handleAddCourse = async () => {
    if (!newCourseSemester || !newCourseScheme.trim()) {
      showErrorAlert("Please select semester and scheme");
      return;
    }

    try {
      const response = await axios.post(config.courses.create, {
        semester: Number(newCourseSemester),
        scheme: newCourseScheme.trim(),
        departmentId: id,
      });

      if (response.data.success) {
        showSuccessAlert("Course added successfully");
        const created = response.data.course;
        setCourses((prev) =>
          [...prev, created].sort((a, b) =>
            a.courseCode.localeCompare(b.courseCode),
          ),
        );
        setDivisionsByCourse((prev) => ({ ...prev, [created._id]: [] }));
        setNewCourseSemester("");
        setNewCourseScheme("");
      } else {
        showErrorAlert(response.data.message || "Failed to add course");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add course";
      console.error("Course creation error:", errorMsg);
      showErrorAlert(errorMsg);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course._id);
    setEditingCourseSemester(course.semester ? String(course.semester) : "");
    setEditingCourseScheme(course.scheme || "");
  };

  const handleUpdateCourse = async (courseId) => {
    if (!editingCourseSemester || !editingCourseScheme.trim()) {
      showErrorAlert("Semester and scheme are required");
      return;
    }

    try {
      const response = await axios.put(config.courses.update(courseId), {
        semester: editingCourseSemester,
        scheme: editingCourseScheme.trim(),
      });

      if (response.data.success) {
        showSuccessAlert("Course updated successfully");
        setCourses((prev) =>
          prev
            .map((course) =>
              course._id === courseId
                ? {
                    ...course,
                    semester: editingCourseSemester,
                    scheme: editingCourseScheme.trim(),
                    courseCode: buildCourseCode(
                      editingCourseSemester,
                      editingCourseScheme.trim(),
                    ),
                  }
                : course,
            )
            .sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
        );
        setEditingCourseId(null);
        setEditingCourseSemester("");
        setEditingCourseScheme("");
      } else {
        showErrorAlert(response.data.message || "Failed to update course");
      }
    } catch (error) {
      showErrorAlert("Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course and its divisions?")) {
      return;
    }

    try {
      const response = await axios.delete(config.courses.delete(courseId));
      if (response.data.success) {
        showSuccessAlert("Course deleted successfully");
        setCourses((prev) => prev.filter((course) => course._id !== courseId));
        setDivisionsByCourse((prev) => {
          const next = { ...prev };
          delete next[courseId];
          return next;
        });
      } else {
        showErrorAlert(response.data.message || "Failed to delete course");
      }
    } catch (error) {
      showErrorAlert("Failed to delete course");
    }
  };

  const handleAddDivision = async (courseId) => {
    const name = (divisionInputs[courseId] || "").trim();
    if (!name) {
      showErrorAlert("Please enter a division name");
      return;
    }

    try {
      const response = await axios.post(config.divisions.create, {
        name,
        courseId,
      });

      if (response.data.success) {
        showSuccessAlert("Division added successfully");
        setDivisionsByCourse((prev) => ({
          ...prev,
          [courseId]: [...(prev[courseId] || []), response.data.division].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        }));
        setDivisionInputs((prev) => ({ ...prev, [courseId]: "" }));
      } else {
        showErrorAlert(response.data.message || "Failed to add division");
      }
    } catch (error) {
      showErrorAlert("Failed to add division");
    }
  };

  const handleEditDivision = (division) => {
    setEditingDivisionId(division._id);
    setEditingDivisionName(division.name);
  };

  const handleUpdateDivision = async (courseId, divisionId) => {
    if (!editingDivisionName.trim()) {
      showErrorAlert("Division name cannot be empty");
      return;
    }

    try {
      const response = await axios.put(config.divisions.update(divisionId), {
        name: editingDivisionName.trim(),
      });

      if (response.data.success) {
        showSuccessAlert("Division updated successfully");
        setDivisionsByCourse((prev) => ({
          ...prev,
          [courseId]: (prev[courseId] || [])
            .map((division) =>
              division._id === divisionId
                ? { ...division, name: editingDivisionName.trim() }
                : division,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
        setEditingDivisionId(null);
        setEditingDivisionName("");
      } else {
        showErrorAlert(response.data.message || "Failed to update division");
      }
    } catch (error) {
      showErrorAlert("Failed to update division");
    }
  };

  const handleDeleteDivision = async (courseId, divisionId) => {
    if (!window.confirm("Delete this division?")) {
      return;
    }

    try {
      const response = await axios.delete(config.divisions.delete(divisionId));
      if (response.data.success) {
        showSuccessAlert("Division deleted successfully");
        setDivisionsByCourse((prev) => ({
          ...prev,
          [courseId]: (prev[courseId] || []).filter(
            (division) => division._id !== divisionId,
          ),
        }));
      } else {
        showErrorAlert(response.data.message || "Failed to delete division");
      }
    } catch (error) {
      showErrorAlert("Failed to delete division");
    }
  };

  return (
    <div className="admin-content dc-page">
      <div className="dc-header">
        <div>
          <h2>Courses & Divisions</h2>
          <p>
            {department
              ? `${department.name} (${department.code})`
              : "Department"}
          </p>
        </div>
        <button
          className="dc-btn dc-btn-secondary"
          onClick={() => navigate("/admin-departments")}
        >
          <i className="bi bi-arrow-left"></i>
          Back to Departments
        </button>
      </div>

      <div className="dc-add-card">
        <div className="dc-add-title">Add Course</div>
        <div className="dc-add-row">
          <select
            value={newCourseSemester}
            onChange={(e) => setNewCourseSemester(e.target.value)}
          >
            <option value="">Select semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
          <select
            value={newCourseScheme}
            onChange={(e) => setNewCourseScheme(e.target.value)}
          >
            <option value="">Select scheme</option>
            {schemeOptions.map((scheme) => (
              <option key={scheme} value={scheme}>
                {scheme}
              </option>
            ))}
          </select>
          <input
            type="text"
            readOnly
            value={buildCourseCode(newCourseSemester, newCourseScheme)}
            placeholder="Course code"
          />
          <button className="dc-btn dc-btn-primary" onClick={handleAddCourse}>
            <i className="bi bi-plus-lg"></i>
            Add Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="dc-empty-state">
          <div className="dc-empty-icon">
            <i className="bi bi-journal-bookmark"></i>
          </div>
          <h3>No Courses Yet</h3>
          <p>Add your first course to start managing divisions.</p>
        </div>
      ) : (
        <div className="dc-grid">
          {courses.map((course) => (
            <div key={course._id} className="dc-card">
              <div className="dc-card-header">
                {editingCourseId === course._id ? (
                  <div className="dc-edit-grid">
                    <select
                      value={editingCourseSemester}
                      onChange={(e) => setEditingCourseSemester(e.target.value)}
                    >
                      <option value="">Select semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editingCourseScheme}
                      onChange={(e) => setEditingCourseScheme(e.target.value)}
                    >
                      <option value="">Select scheme</option>
                      {schemeOptions.map((scheme) => (
                        <option key={scheme} value={scheme}>
                          {scheme}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      readOnly
                      value={buildCourseCode(
                        editingCourseSemester,
                        editingCourseScheme,
                      )}
                      placeholder="Course code"
                    />
                  </div>
                ) : (
                  <div>
                    <h3>{course.courseCode}</h3>
                    <p className="dc-meta">
                      Semester {course.semester} • Scheme {course.scheme}
                    </p>
                  </div>
                )}
                <div className="dc-actions">
                  {editingCourseId === course._id ? (
                    <>
                      <button
                        className="dc-btn dc-btn-secondary"
                        onClick={() => handleUpdateCourse(course._id)}
                      >
                        Save
                      </button>
                      <button
                        className="dc-btn dc-btn-ghost"
                        onClick={() => {
                          setEditingCourseId(null);
                          setEditingCourseSemester("");
                          setEditingCourseScheme("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="dc-btn dc-btn-ghost"
                        onClick={() => handleEditCourse(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="dc-btn dc-btn-danger"
                        onClick={() => handleDeleteCourse(course._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="dc-division-section">
                <div className="dc-division-header">Divisions</div>
                <ul className="dc-division-list">
                  {(divisionsByCourse[course._id] || []).map((division) => (
                    <li key={division._id} className="dc-division-item">
                      {editingDivisionId === division._id ? (
                        <input
                          type="text"
                          value={editingDivisionName}
                          onChange={(e) =>
                            setEditingDivisionName(e.target.value)
                          }
                        />
                      ) : (
                        <span>{division.name}</span>
                      )}
                      <div className="dc-actions">
                        {editingDivisionId === division._id ? (
                          <>
                            <button
                              className="dc-btn dc-btn-secondary"
                              onClick={() =>
                                handleUpdateDivision(course._id, division._id)
                              }
                            >
                              Save
                            </button>
                            <button
                              className="dc-btn dc-btn-ghost"
                              onClick={() => {
                                setEditingDivisionId(null);
                                setEditingDivisionName("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="dc-btn dc-btn-ghost"
                              onClick={() => handleEditDivision(division)}
                            >
                              Edit
                            </button>
                            <button
                              className="dc-btn dc-btn-danger"
                              onClick={() =>
                                handleDeleteDivision(course._id, division._id)
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="dc-division-add-row">
                  <input
                    type="text"
                    placeholder="Division name"
                    value={divisionInputs[course._id] || ""}
                    onChange={(e) =>
                      setDivisionInputs((prev) => ({
                        ...prev,
                        [course._id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="dc-btn dc-btn-secondary"
                    onClick={() => handleAddDivision(course._id)}
                  >
                    <i className="bi bi-plus-lg"></i>
                    Add Division
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentCourses;
