import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { config } from "../config/api";
import PDFViewer from "../basic/PDFViewer";
import "./FacultyELibrary.css";

const FacultyELibrary = () => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [error, setError] = useState("");

  // Filters
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const fileBaseUrl = config.apiBaseUrl.replace("/api", "");

  useEffect(() => {
    fetchEbooks();
    fetchDepartments();
  }, []);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (selectedDept !== "all") params.append("departmentId", selectedDept);
      if (selectedCourse !== "all") params.append("courseId", selectedCourse);
      if (selectedSubject !== "all") params.append("subjectId", selectedSubject);

      const token = localStorage.getItem("token");
      const res = await fetch(`${config.ebooks}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setEbooks(data.ebooks || []);
      } else {
        setError(data.message || "Failed to load library resources");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch library resources from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, [selectedDept, selectedCourse, selectedSubject]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.catalog.departments, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const fetchCourses = async (deptId) => {
    if (!deptId || deptId === "all") {
      setCourses([]);
      setSubjects([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.catalog.courses(deptId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
        setSubjects([]);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const fetchSubjects = async (courseId) => {
    if (!courseId || courseId === "all") {
      setSubjects([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.catalog.subjects}?courseId=${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  };

  const handleDeptChange = async (e) => {
    const val = e.target.value;
    setSelectedDept(val);
    setSelectedCourse("all");
    setSelectedSubject("all");
    await fetchCourses(val);
  };

  const handleCourseChange = async (e) => {
    const val = e.target.value;
    setSelectedCourse(val);
    setSelectedSubject("all");
    await fetchSubjects(val);
  };

  const filteredEbooks = ebooks.filter((book) => {
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.authors.some((a) => a.toLowerCase().includes(q)) ||
      (book.publicationName && book.publicationName.toLowerCase().includes(q)) ||
      book.domains.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="faculty-elibrary-container animate-fadeIn">
      {/* Header */}
      <div className="faculty-elibrary-header">
        <h1 className="faculty-elibrary-title">VP E-Library (Faculties)</h1>
        <p className="faculty-elibrary-subtitle">
          Access Reference Books, Textbooks, and Syllabus Guides mapped across divisions.
        </p>
      </div>

      {error && <div className="faculty-alert error">{error}</div>}

      {/* Filter Options */}
      <div className="faculty-filters-card">
        <div className="filter-input-control">
          <label>Department</label>
          <select value={selectedDept} onChange={handleDeptChange}>
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-input-control">
          <label>Course / Semester</label>
          <select
            value={selectedCourse}
            onChange={handleCourseChange}
            disabled={selectedDept === "all"}
          >
            <option value="all">All Classes</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                Sem {c.semester} - {c.courseCode} ({c.scheme})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-input-control">
          <label>Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={selectedCourse === "all"}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-input-control search-field-col">
          <label>Search Query</label>
          <input
            type="text"
            placeholder="Search eBooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="faculty-loading-wrapper">
          <div className="faculty-loading-ring" />
          <span>Loading E-Books...</span>
        </div>
      ) : filteredEbooks.length === 0 ? (
        <div className="faculty-empty-state">
          <h3>No E-Books Available</h3>
          <p>No digital resources match your filter criteria or have been mapped yet.</p>
        </div>
      ) : (
        <div className="faculty-ebooks-grid">
          {filteredEbooks.map((book) => (
            <div key={book._id} className="faculty-ebook-card">
              <div className="faculty-ebook-cover-wrapper">
                {book.coverImagePath ? (
                  <img
                    src={`${fileBaseUrl}/${book.coverImagePath}`}
                    alt={book.title}
                    className="faculty-ebook-cover-img"
                  />
                ) : (
                  <div className="faculty-ebook-cover-placeholder">
                    <span>📖</span>
                    <small>No Cover Image</small>
                  </div>
                )}
                <button
                  className="faculty-read-btn"
                  onClick={() => setSelectedBook(book)}
                >
                  Quick Read
                </button>
              </div>
              <div className="faculty-ebook-info">
                <h3 className="faculty-ebook-title" title={book.title}>
                  {book.title}
                </h3>
                <p className="faculty-ebook-authors">
                  By {book.authors.join(", ") || "Unknown"}
                </p>
                {book.publicationName && (
                  <p className="faculty-ebook-pub">{book.publicationName}</p>
                )}
                {book.domains && book.domains.length > 0 && (
                  <div className="faculty-ebook-domains">
                    {book.domains.slice(0, 2).map((d, i) => (
                      <span key={i} className="faculty-domain-pill">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF View Modal Overlay */}
      {selectedBook && createPortal(
        <div className="elibrary-preview-overlay" onContextMenu={(e) => e.preventDefault()}>
          {/* Top Header Bar */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "56px",
            backgroundColor: "#1e293b",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            zIndex: 100000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontFamily: "Inter, sans-serif"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "20px" }}>📖</span>
              <span style={{ fontWeight: 600, fontSize: "16px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedBook.title}
              </span>
            </div>
            <button
              onClick={() => setSelectedBook(null)}
              style={{
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px 8px",
                lineHeight: 1,
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "white"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              ✕
            </button>
          </div>
          
          {/* PDF Viewer container with top padding to clear the header */}
          <div style={{ width: "100%", height: "100%", paddingTop: "56px", boxSizing: "border-box" }}>
            <PDFViewer
              url={`${fileBaseUrl}/${selectedBook.filePath}`}
              title={selectedBook.title}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FacultyELibrary;
