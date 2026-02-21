import React, { useState, useEffect } from "react";
import { config } from "../config/api";
import "./Notices.css";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");
  const facultyUsername = localStorage.getItem("username");

  // Fetch notices on mount
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      if (!facultyUsername) {
        setNotices([]);
        return;
      }

      const response = await fetch(
        `${config.apiBaseUrl}/faculty/notices?faculty=${encodeURIComponent(facultyUsername)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? `${config.apiBaseUrl}/faculty/notices/${editingId}`
        : `${config.apiBaseUrl}/faculty/notices`;

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
        }),
      });

      if (response.ok) {
        fetchNotices();
        setNoticeTitle("");
        setNoticeContent("");
        setShowForm(false);
        setEditingId(null);
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
      const response = await fetch(
        `${config.apiBaseUrl}/faculty/notices/${noticeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchNotices();
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
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setNoticeTitle("");
    setNoticeContent("");
    setEditingId(null);
  };

  return (
    <div className="notices-container">
      <div className="notices-header">
        <h3>
          <i className="bi bi-megaphone-fill"></i> Notices & Announcements
        </h3>
        <button
          className="btn-add-notice"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setNoticeTitle("");
            setNoticeContent("");
          }}
          disabled={loading}
        >
          <i className="bi bi-plus-circle"></i> New Notice
        </button>
      </div>

      {showForm && (
        <div className="notice-form">
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
            <label>Notice Content</label>
            <textarea
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              placeholder="Write your notice here..."
              disabled={loading}
              className="form-input notice-editor"
              rows={8}
            />
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

      <div className="notices-list">
        {loading && !showForm ? (
          <div className="loading">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="no-notices">
            <i className="bi bi-inbox"></i>
            <p>No notices yet. Create one to get started!</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className="notice-card">
              <div className="notice-title">{notice.title}</div>
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
          ))
        )}
      </div>
    </div>
  );
};

export default Notices;
