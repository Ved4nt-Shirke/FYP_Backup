import React, { useEffect, useMemo, useState } from "react";
import "./FacultyStudyMaterialManager.css";

const API_BASE = "/api";

const getToken = () => localStorage.getItem("token") || "";

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const categoryOptions = [
  "Notes",
  "Assignment",
  "Question Bank",
  "Lab Manual",
  "Reference",
  "Presentation",
  "Other",
];

const FacultyStudyMaterialManager = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Notes");
  const [resourceType, setResourceType] = useState("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [resourceFile, setResourceFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileResourceCount = useMemo(
    () => materials.filter((item) => item.resourceType !== "link").length,
    [materials],
  );

  const linkResourceCount = useMemo(
    () => materials.filter((item) => item.resourceType === "link").length,
    [materials],
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

  const fetchMaterials = async () => {
    setListLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/study-materials/faculty?activeOnly=true`,
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch study materials");
      }

      const data = await response.json();
      setMaterials(Array.isArray(data.materials) ? data.materials : []);
    } catch (err) {
      setError(err.message || "Failed to fetch study materials");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([fetchDepartments(), fetchMaterials()]);
      } catch (err) {
        setError(err.message || "Unable to load study material setup");
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setCourses([]);
      setDivisions([]);
      setSelectedCourse("");
      setSelectedDivision("");
      return;
    }

    const run = async () => {
      try {
        setError("");
        setSelectedCourse("");
        setSelectedDivision("");
        setDivisions([]);
        await fetchCourses(selectedDepartment);
      } catch (err) {
        setError(err.message || "Unable to fetch courses");
      }
    };

    run();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedCourse) {
      setSelectedDivision("");
      setDivisions([]);
      return;
    }

    const run = async () => {
      try {
        setError("");
        setSelectedDivision("");
        await fetchDivisions(selectedCourse);
      } catch (err) {
        setError(err.message || "Unable to fetch divisions");
      }
    };

    run();
  }, [selectedCourse]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubject("");
    setCategory("Notes");
    setResourceType("file");
    setExternalUrl("");
    setResourceFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !selectedDepartment ||
      !selectedCourse ||
      !selectedDivision ||
      !title.trim()
    ) {
      setError("Please select department/course/division and enter title");
      return;
    }

    if (resourceType === "file" && !resourceFile) {
      setError("Please upload a file for file resource type");
      return;
    }

    if (resourceType === "link" && !externalUrl.trim()) {
      setError("Please provide external URL for link resource type");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("subject", subject.trim() || "General");
    formData.append("category", category);
    formData.append("resourceType", resourceType);
    formData.append("externalUrl", externalUrl.trim());
    formData.append("departmentId", selectedDepartment);
    formData.append("courseId", selectedCourse);
    formData.append("divisionId", selectedDivision);
    if (resourceFile) {
      formData.append("resourceFile", resourceFile);
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/study-materials/faculty`, {
        method: "POST",
        headers: {
          ...authHeaders(),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to publish study material");
      }

      setSuccessMessage(
        "Study material published successfully and visible in student panel.",
      );
      resetForm();
      await fetchMaterials();
    } catch (err) {
      setError(err.message || "Unable to publish study material");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (materialId) => {
    const confirmed = window.confirm(
      "Remove this study material from student panel?",
    );
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/study-materials/faculty/${materialId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        },
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove study material");
      }

      setSuccessMessage("Study material removed successfully.");
      await fetchMaterials();
    } catch (err) {
      setError(err.message || "Unable to remove study material");
    }
  };

  const handleOpen = async (material) => {
    try {
      if (material.resourceType === "link" && material.externalUrl) {
        window.open(material.externalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const response = await fetch(
        `${API_BASE}/study-materials/file/${material._id}`,
        {
          headers: {
            ...authHeaders(),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to open file");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      setError(err.message || "Unable to open study material");
    }
  };

  return (
    <div className="faculty-study-material-manager">
      <section className="fsm-hero">
        <div className="fsm-hero-copy">
          <h1>Study Material Management</h1>
          <p>
            Publish division-wise resources for students with consistent
            categorization and instant availability control.
          </p>
        </div>
        <div className="fsm-hero-stats">
          <div>
            <span>Total Materials</span>
            <strong>{materials.length}</strong>
          </div>
          <div>
            <span>File Resources</span>
            <strong>{fileResourceCount}</strong>
          </div>
          <div>
            <span>External Links</span>
            <strong>{linkResourceCount}</strong>
          </div>
        </div>
      </section>

      {error ? <div className="fsm-alert error">{error}</div> : null}
      {successMessage ? (
        <div className="fsm-alert success">{successMessage}</div>
      ) : null}

      <form className="fsm-form" onSubmit={handleSubmit}>
        <div className="fsm-form-head">
          <h2>Publish New Study Material</h2>
          <p>
            Select context, set resource type, and provide title and content
            source.
          </p>
        </div>

        <div className="fsm-form-grid">
          <label className="fsm-field">
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

          <label className="fsm-field">
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

          <label className="fsm-field">
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

          <label className="fsm-field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="fsm-field">
            <span>Resource Type</span>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              required
            >
              <option value="file">File Upload</option>
              <option value="link">External Link</option>
            </select>
          </label>

          <label className="fsm-field">
            <span>Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              maxLength={120}
            />
          </label>

          <label className="fsm-field fsm-field-wide">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
              maxLength={180}
              required
            />
          </label>

          <label className="fsm-field fsm-field-wide">
            <span>Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for students"
              maxLength={2000}
            />
          </label>
        </div>

        {resourceType === "file" ? (
          <div className="fsm-upload-block">
            <div>
              <h3>Upload File</h3>
              <p>Accepted: PDF, DOC, PPT, ZIP, Image, MP4</p>
            </div>
            <label className="fsm-file-label">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.mp4"
                onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                required
              />
              <span>{resourceFile ? resourceFile.name : "Choose file"}</span>
            </label>
          </div>
        ) : (
          <div className="fsm-upload-block fsm-link-block">
            <label className="fsm-field fsm-field-wide">
              <span>External URL</span>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </label>
          </div>
        )}

        <div className="fsm-actions-row">
          <button type="submit" disabled={loading}>
            {loading ? "Publishing..." : "Publish Study Material"}
          </button>
        </div>
      </form>

      <section className="fsm-list">
        <div className="fsm-list-head">
          <h2>Published Materials</h2>
          <button type="button" onClick={fetchMaterials} disabled={listLoading}>
            {listLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {listLoading ? (
          <p className="fsm-empty-state">Loading materials...</p>
        ) : materials.length === 0 ? (
          <p className="fsm-empty-state">No study materials published yet.</p>
        ) : (
          <div className="fsm-cards">
            {materials.map((item) => (
              <article key={item._id} className="fsm-card">
                <div className="fsm-card-meta">
                  <span>{item.category}</span>
                  <span>{item.divisionId?.name || item.divisionName}</span>
                </div>
                <h3>{item.title}</h3>
                <p>
                  Subject: {item.subject || "General"} • Course:{" "}
                  {item.courseId?.courseCode || "-"}
                  {item.courseId?.semester
                    ? ` • Semester ${item.courseId.semester}`
                    : ""}
                </p>
                {item.description ? <p>{item.description}</p> : null}
                <p>
                  Published on {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <div className="fsm-card-actions">
                  <button
                    type="button"
                    className="fsm-secondary"
                    onClick={() => handleOpen(item)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="fsm-danger"
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

export default FacultyStudyMaterialManager;
