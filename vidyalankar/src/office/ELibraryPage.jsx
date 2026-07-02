import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { config } from "../config/api";
import PDFViewer from "../basic/PDFViewer";
import "./ELibraryPage.css";

const ELibraryPage = () => {
  const [activeTab, setActiveTab] = useState("all"); // "all", "add", "manage"
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dropdown option sets
  const [departments, setDepartments] = useState([]);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    title: "",
    author1: "",
    author2: "",
    author3: "",
    author4: "",
    publicationName: "",
    domain1: "",
    domain2: "",
    domain3: "",
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [bookPdfFile, setBookPdfFile] = useState(null);

  // Preview URLs for files during upload
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");

  // Cascading Mappings State
  const [mappings, setMappings] = useState([
    { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
    { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
    { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
  ]);

  // Edit State
  const [editingBookId, setEditingBookId] = useState(null);
  const [selectedBookForPreview, setSelectedBookForPreview] = useState(null);

  const fileBaseUrl = config.apiBaseUrl.replace("/api", "");

  useEffect(() => {
    fetchEbooks();
    fetchDepartments();
  }, []);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(config.ebooks, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setEbooks(data.ebooks || []);
      } else {
        setError(data.message || "Failed to load e-books");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchCoursesForIndex = async (index, departmentId) => {
    if (!departmentId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(config.catalog.courses(departmentId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setMappings((prev) => {
          const updated = [...prev];
          updated[index].coursesList = data.courses || [];
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const fetchSubjectsForIndex = async (index, courseId) => {
    if (!courseId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.catalog.subjects}?courseId=${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setMappings((prev) => {
          const updated = [...prev];
          updated[index].subjectsList = data.subjects || [];
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  };

  const handleMappingChange = async (index, field, value) => {
    setMappings((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      if (field === "departmentId") {
        updated[index].courseId = "";
        updated[index].subjectId = "";
        updated[index].coursesList = [];
        updated[index].subjectsList = [];
      } else if (field === "courseId") {
        updated[index].subjectId = "";
        updated[index].subjectsList = [];
      }
      return updated;
    });

    if (field === "departmentId") {
      await fetchCoursesForIndex(index, value);
    } else if (field === "courseId") {
      await fetchSubjectsForIndex(index, value);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file only.");
        return;
      }
      setBookPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  const handleResetForm = () => {
    setFormData({
      title: "",
      author1: "",
      author2: "",
      author3: "",
      author4: "",
      publicationName: "",
      domain1: "",
      domain2: "",
      domain3: "",
    });
    setCoverImageFile(null);
    setBookPdfFile(null);
    setCoverPreviewUrl("");
    setPdfFileName("");
    setMappings([
      { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
      { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
      { departmentId: "", courseId: "", subjectId: "", coursesList: [], subjectsList: [] },
    ]);
    setEditingBookId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError("Book Title is required.");
      return;
    }
    if (!editingBookId && !bookPdfFile) {
      setError("Please upload an E-Book PDF file.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const authors = [
        formData.author1,
        formData.author2,
        formData.author3,
        formData.author4,
      ]
        .map((a) => a.trim())
        .filter(Boolean);

      const domains = [formData.domain1, formData.domain2, formData.domain3]
        .map((d) => d.trim())
        .filter(Boolean);

      // Clean mappings to only include valid entries
      const cleanedMappings = mappings
        .filter((m) => m.departmentId && m.courseId && m.subjectId)
        .map((m) => ({
          departmentId: m.departmentId,
          courseId: m.courseId,
          subjectId: m.subjectId,
        }));

      if (cleanedMappings.length === 0) {
        setError("Please define at least one valid Class & Subject mapping.");
        setSubmitting(false);
        return;
      }

      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("publicationName", formData.publicationName);
      uploadData.append("authors", JSON.stringify(authors));
      uploadData.append("domains", JSON.stringify(domains));
      uploadData.append("mappings", JSON.stringify(cleanedMappings));

      if (bookPdfFile) {
        uploadData.append("bookFile", bookPdfFile);
      }
      if (coverImageFile) {
        uploadData.append("coverImage", coverImageFile);
      }

      const token = localStorage.getItem("token");
      const url = editingBookId ? `${config.ebooks}/${editingBookId}` : config.ebooks;
      const method = editingBookId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadData,
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(
          editingBookId
            ? "E-Book updated successfully!"
            : "E-Book uploaded successfully!"
        );
        handleResetForm();
        fetchEbooks();
        setActiveTab("all");
      } else {
        setError(data.message || "Failed to save e-book.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while uploading. Please check files and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = async (book) => {
    setEditingBookId(book._id);
    setFormData({
      title: book.title,
      author1: book.authors[0] || "",
      author2: book.authors[1] || "",
      author3: book.authors[2] || "",
      author4: book.authors[3] || "",
      publicationName: book.publicationName || "",
      domain1: book.domains[0] || "",
      domain2: book.domains[1] || "",
      domain3: book.domains[2] || "",
    });

    if (book.coverImagePath) {
      setCoverPreviewUrl(`${fileBaseUrl}/${book.coverImagePath}`);
    } else {
      setCoverPreviewUrl("");
    }
    setPdfFileName(book.filePath.split("/").pop());

    // Pre-populate mappings list with lists fetched dynamically
    const prepMappings = await Promise.all(
      [0, 1, 2].map(async (i) => {
        const existing = book.mappings[i];
        if (existing) {
          // Fetch lists
          const token = localStorage.getItem("token");
          // Courses
          const coursesRes = await fetch(
            config.catalog.courses(existing.departmentId._id || existing.departmentId),
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const coursesData = await coursesRes.json();
          // Subjects
          const subjectsRes = await fetch(
            `${config.catalog.subjects}?courseId=${existing.courseId._id || existing.courseId}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          const subjectsData = await subjectsRes.json();

          return {
            departmentId: existing.departmentId._id || existing.departmentId,
            courseId: existing.courseId._id || existing.courseId,
            subjectId: existing.subjectId._id || existing.subjectId,
            coursesList: coursesData.success ? coursesData.courses : [],
            subjectsList: subjectsData.success ? subjectsData.subjects : [],
          };
        }
        return {
          departmentId: "",
          courseId: "",
          subjectId: "",
          coursesList: [],
          subjectsList: [],
        };
      })
    );

    setMappings(prepMappings);
    setActiveTab("add");
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this e-book permanently?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.ebooks}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("E-Book deleted successfully!");
        fetchEbooks();
      } else {
        setError(data.message || "Failed to delete e-book.");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server.");
    }
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
    <div className="elibrary-container animate-fadeIn">
      {/* Title block */}
      <div className="elibrary-header-row">
        <div>
          <h1 className="elibrary-title">VP-Library (E-Books)</h1>
          <p className="elibrary-subtitle">
            Upload, map, and manage educational resources for students and faculties.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="elibrary-tab-buttons">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("all");
              handleResetForm();
            }}
          >
            All E-Books
          </button>
          <button
            className={`tab-btn ${activeTab === "manage" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("manage");
              handleResetForm();
            }}
          >
            Manage Library
          </button>
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => {
              handleResetForm();
              setActiveTab("add");
            }}
          >
            {editingBookId ? "Edit E-Book" : "Add E-Book"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <div className="alert-banner error">{error}</div>}
      {success && <div className="alert-banner success">{success}</div>}

      {/* Tab 1: All E-Books (Grid View) */}
      {activeTab === "all" && (
        <div className="elibrary-grid-view">
          <div className="search-bar-row">
            <input
              type="text"
              placeholder="Search ebooks by title, author, publication, domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading-spinner-wrapper">
              <div className="loading-ring-spinner" />
              <span>Loading library...</span>
            </div>
          ) : filteredEbooks.length === 0 ? (
            <div className="empty-state-card">
              <h3>No E-Books Found</h3>
              <p>There are no e-books matching your query or uploaded yet.</p>
            </div>
          ) : (
            <div className="ebooks-cards-grid">
              {filteredEbooks.map((book) => (
                <div key={book._id} className="ebook-card">
                  <div className="ebook-cover-wrapper">
                    {book.coverImagePath ? (
                      <img
                        src={`${fileBaseUrl}/${book.coverImagePath}`}
                        alt={book.title}
                        className="ebook-cover-img"
                      />
                    ) : (
                      <div className="ebook-cover-placeholder">
                        <span>📚</span>
                        <small>No Cover Image</small>
                      </div>
                    )}
                    <button
                      className="view-overlay-btn"
                      onClick={() => setSelectedBookForPreview(book)}
                    >
                      Quick Read
                    </button>
                  </div>
                  <div className="ebook-details-block">
                    <h3 className="ebook-card-title">{book.title}</h3>
                    <p className="ebook-card-authors">
                      By {book.authors.join(", ") || "Unknown Author"}
                    </p>
                    {book.publicationName && (
                      <p className="ebook-card-pub">Pub: {book.publicationName}</p>
                    )}
                    {book.domains && book.domains.length > 0 && (
                      <div className="ebook-card-domains">
                        {book.domains.map((d, i) => (
                          <span key={i} className="domain-pill">
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
        </div>
      )}

      {/* Tab 2: Add / Edit E-Book Form */}
      {activeTab === "add" && (
        <form onSubmit={handleSubmit} className="ebook-form-card">
          <div className="form-sections-row">
            {/* Left side fields */}
            <div className="form-left-col">
              <h2 className="section-header-label">Book Metadata</h2>

              <div className="form-input-control">
                <label>Title of Book <span className="req">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Artificial Intelligence in IoT"
                  required
                />
              </div>

              <div className="authors-form-grid">
                <div className="form-input-control">
                  <label>Author 1</label>
                  <input
                    type="text"
                    name="author1"
                    value={formData.author1}
                    onChange={handleInputChange}
                    placeholder="Primary Author"
                  />
                </div>
                <div className="form-input-control">
                  <label>Author 2</label>
                  <input
                    type="text"
                    name="author2"
                    value={formData.author2}
                    onChange={handleInputChange}
                    placeholder="Co-Author"
                  />
                </div>
                <div className="form-input-control">
                  <label>Author 3</label>
                  <input
                    type="text"
                    name="author3"
                    value={formData.author3}
                    onChange={handleInputChange}
                    placeholder="Co-Author"
                  />
                </div>
                <div className="form-input-control">
                  <label>Author 4</label>
                  <input
                    type="text"
                    name="author4"
                    value={formData.author4}
                    onChange={handleInputChange}
                    placeholder="Co-Author"
                  />
                </div>
              </div>

              <div className="form-input-control">
                <label>Publication Name</label>
                <input
                  type="text"
                  name="publicationName"
                  value={formData.publicationName}
                  onChange={handleInputChange}
                  placeholder="e.g. Springer, John Wiley"
                />
              </div>

              <div className="domains-form-grid">
                <div className="form-input-control">
                  <label>Domain 1</label>
                  <input
                    type="text"
                    name="domain1"
                    value={formData.domain1}
                    onChange={handleInputChange}
                    placeholder="e.g. Web Development"
                  />
                </div>
                <div className="form-input-control">
                  <label>Domain 2</label>
                  <input
                    type="text"
                    name="domain2"
                    value={formData.domain2}
                    onChange={handleInputChange}
                    placeholder="e.g. Cloud Computing"
                  />
                </div>
                <div className="form-input-control">
                  <label>Domain 3</label>
                  <input
                    type="text"
                    name="domain3"
                    value={formData.domain3}
                    onChange={handleInputChange}
                    placeholder="e.g. Cybersecurity"
                  />
                </div>
              </div>

              {/* Upload controls */}
              <div className="files-upload-block">
                <div className="form-input-control">
                  <label>Upload Front Cover Image (.jpeg/.jpg/.png)</label>
                  <div className="file-uploader-box">
                    <input
                      type="file"
                      id="cover-uploader"
                      accept="image/*"
                      onChange={handleCoverChange}
                    />
                    <label htmlFor="cover-uploader" className="file-uploader-label">
                      {coverPreviewUrl ? (
                        <div className="cover-img-preview-box">
                          <img src={coverPreviewUrl} alt="Cover Preview" />
                          <span>Change Image</span>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <span>🖼️ Choose image file...</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="form-input-control">
                  <label>Upload E-Book File (.pdf) <span className="req">*</span></label>
                  <div className="file-uploader-box">
                    <input
                      type="file"
                      id="pdf-uploader"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                    />
                    <label htmlFor="pdf-uploader" className="file-uploader-label">
                      {pdfFileName ? (
                        <div className="pdf-preview-box">
                          <span>📄 {pdfFileName}</span>
                          <span className="change-btn">Change PDF</span>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <span>📥 Select PDF Book file...</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side fields (Mappings) */}
            <div className="form-right-col">
              <h2 className="section-header-label">Target Audience / Subject Mappings</h2>
              <p className="section-info-desc">
                Map this book to up to 3 combinations of Department, Course/Semester, and Subject.
              </p>

              {mappings.map((mapping, idx) => (
                <div key={idx} className="mapping-card-block">
                  <span className="mapping-index-badge">Mapping {idx + 1}</span>

                  <div className="form-input-control">
                    <label>Select Department</label>
                    <select
                      value={mapping.departmentId}
                      onChange={(e) => handleMappingChange(idx, "departmentId", e.target.value)}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-input-control">
                    <label>Select Class (Course / Semester)</label>
                    <select
                      value={mapping.courseId}
                      onChange={(e) => handleMappingChange(idx, "courseId", e.target.value)}
                      disabled={!mapping.departmentId}
                    >
                      <option value="">-- Select Course / Semester --</option>
                      {mapping.coursesList.map((c) => (
                        <option key={c._id} value={c._id}>
                          Semester {c.semester} - {c.courseCode} ({c.scheme})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-input-control">
                    <label>Select Subject</label>
                    <select
                      value={mapping.subjectId}
                      onChange={(e) => handleMappingChange(idx, "subjectId", e.target.value)}
                      disabled={!mapping.courseId}
                    >
                      <option value="">-- Select Subject --</option>
                      {mapping.subjectsList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-action-footer">
            <button
              type="button"
              className="wizard-btn-outline"
              onClick={() => {
                setActiveTab("all");
                handleResetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wizard-btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="loading-ring-spinner small" /> Saving...
                </>
              ) : editingBookId ? (
                "Update E-Book"
              ) : (
                "Upload E-Book"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Manage Library (Table List View) */}
      {activeTab === "manage" && (
        <div className="elibrary-manage-view">
          <div className="search-bar-row">
            <input
              type="text"
              placeholder="Filter list by title, author, publication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading-spinner-wrapper">
              <div className="loading-ring-spinner" />
              <span>Loading books catalog...</span>
            </div>
          ) : filteredEbooks.length === 0 ? (
            <div className="empty-state-card">
              <h3>No books to manage</h3>
              <p>Try searching something else or upload a new book.</p>
            </div>
          ) : (
            <div className="table-container office-scrollable">
              <table className="ebooks-records-table">
                <thead>
                  <tr>
                    <th>Book Cover</th>
                    <th>Title</th>
                    <th>Authors</th>
                    <th>Publication</th>
                    <th>Domains</th>
                    <th>Class & Subject Mapping</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEbooks.map((book) => (
                    <tr key={book._id}>
                      <td className="table-cover-cell">
                        {book.coverImagePath ? (
                          <img
                            src={`${fileBaseUrl}/${book.coverImagePath}`}
                            alt={book.title}
                            className="table-cover-img"
                          />
                        ) : (
                          <div className="table-cover-placeholder">📚</div>
                        )}
                      </td>
                      <td>
                        <strong className="book-title-clickable" onClick={() => setSelectedBookForPreview(book)}>
                          {book.title}
                        </strong>
                      </td>
                      <td>{book.authors.join(", ") || "-"}</td>
                      <td>{book.publicationName || "-"}</td>
                      <td>
                        <div className="flex-wrap-pills">
                          {book.domains.map((d, i) => (
                            <span key={i} className="domain-pill compact">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <ul className="table-mapping-list">
                          {book.mappings.map((m, i) => (
                            <li key={i}>
                              {m.departmentId?.code} - Sem {m.courseId?.semester} ({m.subjectId?.name})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          <button
                            className="action-btn-view"
                            onClick={() => setSelectedBookForPreview(book)}
                          >
                            View
                          </button>
                          <button
                            className="action-btn-edit"
                            onClick={() => handleEditClick(book)}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn-delete"
                            onClick={() => handleDeleteClick(book._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PDF View Modal Overlay */}
      {selectedBookForPreview && createPortal(
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
                {selectedBookForPreview.title}
              </span>
            </div>
            <button
              onClick={() => setSelectedBookForPreview(null)}
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
              url={`${fileBaseUrl}/${selectedBookForPreview.filePath}`}
              title={selectedBookForPreview.title}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ELibraryPage;
