import React, { useEffect, useMemo, useState } from "react";
import "./StudentTimetableManager.css";

const API_BASE = "/api";

const semesterToYearLabel = (semester) => {
  const sem = Number(semester || 0);
  if (sem <= 2) return "First Year";
  if (sem <= 4) return "Second Year";
  if (sem <= 6) return "Third Year";
  return "Final Year";
};

const getToken = () => localStorage.getItem("token") || "";

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const StudentTimetableManager = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [timetables, setTimetables] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [semesterEndDate, setSemesterEndDate] = useState("");
  const [title, setTitle] = useState("Class Timetable");
  const [timetableFile, setTimetableFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedCourseDetails = useMemo(
    () => courses.find((course) => course._id === selectedCourse),
    [courses, selectedCourse],
  );

  const visibleCount = useMemo(
    () => timetables.filter((item) => item.isActive !== false).length,
    [timetables],
  );

  const fetchDepartments = async () => {
    const response = await fetch(`${API_BASE}/catalog/departments`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch departments");
    }

    const data = await response.json();
    setDepartments(Array.isArray(data.departments) ? data.departments : []);
  };

  const fetchCourses = async (departmentId) => {
    if (!departmentId) {
      setCourses([]);
      return;
    }

    const response = await fetch(
      `${API_BASE}/catalog/courses/${departmentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }

    const data = await response.json();
    setCourses(Array.isArray(data.courses) ? data.courses : []);
  };

  const fetchDivisions = async (courseId) => {
    if (!courseId) {
      setDivisions([]);
      return;
    }

    const response = await fetch(`${API_BASE}/catalog/divisions/${courseId}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch divisions");
    }

    const data = await response.json();
    setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
  };

  const fetchTimetables = async () => {
    setListLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/student-timetables/faculty?activeOnly=true`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch timetables");
      }

      const data = await response.json();
      setTimetables(Array.isArray(data.timetables) ? data.timetables : []);
    } catch (err) {
      setError(err.message || "Failed to load timetable records");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setError("");
        await Promise.all([fetchDepartments(), fetchTimetables()]);
      } catch (err) {
        setError(err.message || "Unable to initialize timetable page");
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setCourses([]);
      setSelectedCourse("");
      setSelectedDivision("");
      setDivisions([]);
      setSelectedYear("");
      return;
    }

    const loadCourses = async () => {
      try {
        setError("");
        setSelectedCourse("");
        setSelectedDivision("");
        setDivisions([]);
        setSelectedYear("");
        await fetchCourses(selectedDepartment);
      } catch (err) {
        setError(err.message || "Unable to fetch courses");
      }
    };

    loadCourses();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedCourse) {
      setDivisions([]);
      setSelectedDivision("");
      setSelectedYear("");
      return;
    }

    const loadDivisions = async () => {
      try {
        setError("");
        setSelectedDivision("");
        await fetchDivisions(selectedCourse);
      } catch (err) {
        setError(err.message || "Unable to fetch divisions");
      }
    };

    setSelectedYear(semesterToYearLabel(selectedCourseDetails?.semester));
    loadDivisions();
  }, [selectedCourse, selectedCourseDetails?.semester]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !selectedDepartment ||
      !selectedCourse ||
      !selectedDivision ||
      !selectedYear ||
      !semesterEndDate ||
      !timetableFile
    ) {
      setError(
        "Please complete all required fields and upload a timetable file",
      );
      return;
    }

    const payload = new FormData();
    payload.append("title", title || "Class Timetable");
    payload.append("year", selectedYear);
    payload.append("departmentId", selectedDepartment);
    payload.append("courseId", selectedCourse);
    payload.append("divisionId", selectedDivision);
    payload.append("semesterEndDate", semesterEndDate);
    payload.append("timetableFile", timetableFile);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/student-timetables/faculty`, {
        method: "POST",
        headers: {
          ...authHeaders(),
        },
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload timetable");
      }

      setSuccessMessage("Timetable published for student panel successfully");
      setTimetableFile(null);
      setSemesterEndDate("");
      await fetchTimetables();
    } catch (err) {
      setError(err.message || "Failed to publish timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (timetableId) => {
    const confirmed = window.confirm(
      "Remove this timetable from student panel?",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/student-timetables/faculty/${timetableId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to remove timetable");
      }

      setSuccessMessage("Timetable removed. Students can no longer view it.");
      await fetchTimetables();
    } catch (err) {
      setError(err.message || "Unable to remove timetable");
    }
  };

  const handlePreview = async (timetableId) => {
    try {
      const response = await fetch(
        `${API_BASE}/student-timetables/file/${timetableId}`,
        {
          headers: {
            ...authHeaders(),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to open timetable file");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      setError(err.message || "Unable to open timetable");
    }
  };

  return (
    <div className="student-timetable-manager">
      <section className="stm-hero">
        <div className="stm-hero-copy">
          <h1>Student Timetable Publisher</h1>
          <p>
            Publish a division-wise timetable for the student panel. It will be visible immediately to students of that division.
          </p>
        </div>
        <div className="stm-hero-stats">
          <div>
            <span>Active Records</span>
            <strong>{timetables.length}</strong>
          </div>
          <div>
            <span>Visible Now</span>
            <strong>{visibleCount}</strong>
          </div>
          <div>
            <span>Pending Release</span>
            <strong>{Math.max(timetables.length - visibleCount, 0)}</strong>
          </div>
        </div>
      </section>

      {error ? <div className="stm-alert error">{error}</div> : null}
      {successMessage ? (
        <div className="stm-alert success">{successMessage}</div>
      ) : null}

      <form className="stm-form" onSubmit={handleSubmit}>
        <div className="stm-form-head">
          <h2>Publish New Timetable</h2>
          <p>Complete academic context, set release date, and upload file.</p>
        </div>

        <div className="stm-form-grid">
          <label className="stm-field">
            <span>Department</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name} ({department.code})
                </option>
              ))}
            </select>
          </label>

          <label className="stm-field">
            <span>Course / Semester</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              disabled={!selectedDepartment}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode} | Sem {course.semester} | {course.scheme}
                </option>
              ))}
            </select>
          </label>

          <label className="stm-field">
            <span>Division</span>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              required
              disabled={!selectedCourse}
            >
              <option value="">Select division</option>
              {divisions.map((division) => (
                <option key={division._id} value={division._id}>
                  {division.name}
                </option>
              ))}
            </select>
          </label>

          <label className="stm-field">
            <span>Year</span>
            <input
              type="text"
              value={selectedYear}
              readOnly
              placeholder="Auto from selected course"
            />
          </label>

          <label className="stm-field">
            <span>Semester End Date</span>
            <input
              type="date"
              value={semesterEndDate}
              onChange={(e) => setSemesterEndDate(e.target.value)}
              required
            />
          </label>

          <label className="stm-field">
            <span>Timetable Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Class Timetable"
              maxLength={120}
            />
          </label>
        </div>

        <div className="stm-upload-block">
          <div>
            <h3>Timetable File</h3>
            <p>Allowed formats: PDF, PNG, JPG, WEBP</p>
          </div>
          <label className="stm-file-label">
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
              required
            />
            <span>{timetableFile?.name || "Choose file"}</span>
          </label>
        </div>

        <div className="stm-actions-row">
          <button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish Timetable"}
          </button>
        </div>
      </form>

      <section className="stm-list">
        <div className="stm-list-head">
          <h2>Active Timetables</h2>
          <button
            type="button"
            onClick={fetchTimetables}
            disabled={listLoading}
          >
            {listLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {listLoading ? (
          <p className="empty-state">Loading timetable records...</p>
        ) : timetables.length === 0 ? (
          <p className="stm-empty-state">No active timetable published yet.</p>
        ) : (
          <div className="stm-cards">
            {timetables.map((item) => (
              <article key={item._id} className="stm-card">
                <div className="stm-card-meta">
                  <span>{item.year}</span>
                  <span>{item.divisionId?.name || item.divisionName}</span>
                </div>
                <h3>{item.title || "Class Timetable"}</h3>
                <p>
                  Course: {item.courseId?.courseCode || "-"} • Semester:{" "}
                  {item.courseId?.semester || "-"}
                </p>
                <p>
                  Semester End Date:{" "}
                  {new Date(item.semesterEndDate).toLocaleDateString()}
                </p>
                <div className="stm-card-actions">
                  <button
                    type="button"
                    className="stm-secondary"
                    onClick={() => handlePreview(item._id)}
                  >
                    View File
                  </button>
                  <button
                    type="button"
                    className="stm-danger"
                    onClick={() => handleRemove(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentTimetableManager;
