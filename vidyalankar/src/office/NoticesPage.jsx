import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "../faculty/components/ErrorBoundary";
import "./NoticesPage.css";

const NoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorRef = useRef(null);

  const token = localStorage.getItem("token");
  const facultyUsername = localStorage.getItem("username");
  const apiUrl = "http://localhost:5000";

  // Fetch divisions and notices on mount
  useEffect(() => {
    fetchDivisions();
    fetchNotices();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    if (!editorRef.current) return;
    const nextHtml = noticeContent || "";
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [showForm, noticeContent, editingId]);

  const fetchDivisions = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/students/divisions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDivisions(data.divisions || []);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/office/notices?faculty=${facultyUsername}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setNotices(data.notices || []);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim() || !selectedDivision) {
      alert("Title, content and division are required");
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? `${apiUrl}/api/office/notices/${editingId}`
        : `${apiUrl}/api/office/notices`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          faculty: facultyUsername,
          division: selectedDivision,
        }),
      });

      if (response.ok) {
        fetchNotices();
        setNoticeTitle("");
        setNoticeContent("");
        setSelectedDivision("");
        setShowForm(false);
        setEditingId(null);
        alert("Notice saved successfully!");
      } else {
        alert("Error saving notice");
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      alert("Error saving notice");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/office/notices/${noticeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchNotices();
        alert("Notice deleted successfully!");
      } else {
        alert("Error deleting notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      alert("Error deleting notice");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotice = (notice) => {
    setEditingId(notice._id);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setSelectedDivision(notice.division);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setNoticeTitle("");
    setNoticeContent("");
    setSelectedDivision("");
    setEditingId(null);
  };

  // Format functions for the custom editor
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleEditorInput = (e) => {
    setNoticeContent(e.currentTarget.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      applyFormat("createLink", url);
    }
  };

  const changeColor = (e) => {
    applyFormat("foreColor", e.target.value);
  };

  return (
    <ErrorBoundary>
      <div className="notices-page">
        <div className="notices-header">
          <div>
            <h1>
              <i className="bi bi-megaphone-fill"></i> Notices & Announcements
            </h1>
            <p className="subtitle">
              Create and manage notices for your students
            </p>
          </div>
          <button
            className="office-btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setNoticeTitle("");
              setNoticeContent("");
              setSelectedDivision("");
            }}
            disabled={loading}
          >
            <i className="bi bi-plus-circle"></i> New Notice
          </button>
        </div>

        <div className="notices-page-content">
          {showForm && (
            <div className="notice-form-page">
              <h2>{editingId ? "Edit Notice" : "Create New Notice"}</h2>
              <div className="form-group">
                <label>Notice Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter notice title"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Division</label>
                <select
                  className="form-input"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Select Division --</option>
                  {divisions.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notice Content</label>
                <div className="custom-editor">
                  <div className="editor-toolbar">
                    <button
                      type="button"
                      onClick={() => applyFormat("bold")}
                      className="toolbar-btn"
                      title="Bold"
                      disabled={loading}
                    >
                      <i className="bi bi-type-bold"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("italic")}
                      className="toolbar-btn"
                      title="Italic"
                      disabled={loading}
                    >
                      <i className="bi bi-type-italic"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("underline")}
                      className="toolbar-btn"
                      title="Underline"
                      disabled={loading}
                    >
                      <i className="bi bi-type-underline"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("strikeThrough")}
                      className="toolbar-btn"
                      title="Strikethrough"
                      disabled={loading}
                    >
                      <i className="bi bi-type-strikethrough"></i>
                    </button>
                    <span className="toolbar-divider"></span>
                    <button
                      type="button"
                      onClick={() => applyFormat("insertUnorderedList")}
                      className="toolbar-btn"
                      title="Bullet List"
                      disabled={loading}
                    >
                      <i className="bi bi-list-ul"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("insertOrderedList")}
                      className="toolbar-btn"
                      title="Numbered List"
                      disabled={loading}
                    >
                      <i className="bi bi-list-ol"></i>
                    </button>
                    <span className="toolbar-divider"></span>
                    <button
                      type="button"
                      onClick={insertLink}
                      className="toolbar-btn"
                      title="Insert Link"
                      disabled={loading}
                    >
                      <i className="bi bi-link-45deg"></i>
                    </button>
                    <input
                      type="color"
                      onChange={changeColor}
                      className="toolbar-color"
                      title="Text Color"
                      disabled={loading}
                    />
                  </div>
                  <div
                    ref={editorRef}
                    className="editor-content"
                    contentEditable={!loading}
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    data-placeholder="Write your notice here..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNotice}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="bi bi-hourglass-split"></i> Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <i className="bi bi-check-circle"></i> Update Notice
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle"></i> Create Notice
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="notices-list-page">
            <h2>All Notices</h2>
            {loading && !showForm ? (
              <div className="loading">
                <i className="bi bi-hourglass-split"></i> Loading notices...
              </div>
            ) : notices.length === 0 ? (
              <div className="no-notices">
                <i className="bi bi-inbox"></i>
                <p>No notices yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="notices-grid">
                {notices.map((notice) => (
                  <div key={notice._id} className="notice-card-page">
                    <div className="notice-title">{notice.title}</div>
                    <div className="notice-division">
                      <span className="badge">Division: {notice.division}</span>
                    </div>
                    <div
                      className="notice-content"
                      dangerouslySetInnerHTML={{ __html: notice.content }}
                    ></div>
                    <div className="notice-footer">
                      <small className="notice-date">
                        <i className="bi bi-calendar"></i>{" "}
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </small>
                      <div className="notice-actions">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEditNotice(notice)}
                          title="Edit"
                          disabled={loading}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteNotice(notice._id)}
                          title="Delete"
                          disabled={loading}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default NoticesPage;
