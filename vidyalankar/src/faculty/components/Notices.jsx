import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { config } from "../../config/api";
import "./Notices.css";

const CKEDITOR_CDN = "https://cdn.ckeditor.com/4.21.0/standard/ckeditor.js";
const CKEDITOR_TEXTAREA_ID = "faculty-notice-ckeditor";

const loadCkEditorScript = () => {
  if (window.CKEDITOR) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector(`script[src="${CKEDITOR_CDN}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load CKEditor script")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CKEDITOR_CDN;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load CKEditor script"));
    document.body.appendChild(script);
  });
};

const isRichTextEmpty = (html = "") =>
  !String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const editorInstanceRef = useRef(null);
  const editorInitRef = useRef(false);

  const token = localStorage.getItem("token");
  const facultyUsername = localStorage.getItem("username");

  // Fetch notices on mount
  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const setupEditor = async () => {
      if (!showForm || editorInitRef.current) return;

      try {
        editorInitRef.current = true;
        await loadCkEditorScript();
        if (cancelled || !window.CKEDITOR) return;

        const existing = window.CKEDITOR.instances[CKEDITOR_TEXTAREA_ID];
        if (existing) {
          existing.destroy(true);
        }

        const instance = window.CKEDITOR.replace(CKEDITOR_TEXTAREA_ID, {
          height: 220,
          removePlugins: "elementspath",
          resize_enabled: false,
        });

        instance.on("instanceReady", () => {
          instance.setData(noticeContent || "");
          instance.setReadOnly(loading);
        });

        instance.on("change", () => {
          setNoticeContent(instance.getData());
        });

        editorInstanceRef.current = instance;
      } catch (error) {
        console.error("Failed to initialize CKEditor:", error);
        alert("Failed to load rich text editor. Please refresh and try again.");
      }
    };

    setupEditor();

    return () => {
      cancelled = true;
      editorInitRef.current = false;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy(true);
        editorInstanceRef.current = null;
      }
    };
  }, [showForm]);

  useEffect(() => {
    if (!showForm || !editorInstanceRef.current) return;
    const currentData = editorInstanceRef.current.getData();
    if (currentData !== noticeContent) {
      editorInstanceRef.current.setData(noticeContent || "");
    }
  }, [noticeContent, showForm]);

  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.setReadOnly(loading);
    }
  }, [loading]);

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
    const rawContent =
      editorInstanceRef.current?.getData?.() ?? noticeContent;
    const contentToSave = DOMPurify.sanitize(rawContent);

    if (!noticeTitle.trim() || isRichTextEmpty(contentToSave)) {
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
          content: contentToSave,
          faculty: facultyUsername,
        }),
      });

      if (response.ok) {
        fetchNotices();
        setNoticeTitle("");
        setNoticeContent("");
        setShowForm(false);
        setEditingId(null);
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy(true);
          editorInstanceRef.current = null;
        }
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
    if (editorInstanceRef.current) {
      editorInstanceRef.current.destroy(true);
      editorInstanceRef.current = null;
    }
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
              id={CKEDITOR_TEXTAREA_ID}
              defaultValue={noticeContent}
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
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content || "") }}
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
