import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "../faculty/components/ErrorBoundary";
import { config, getApiUrl } from "../config/api";
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
  
  // Filters & Search
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDivision, setFilterDivision] = useState("");

  const editorRef = useRef(null);
  const token = localStorage.getItem("token");
  const facultyUsername = localStorage.getItem("username") || "office";

  // Fetch divisions and notices on mount
  useEffect(() => {
    fetchDivisions();
    fetchNotices();
  }, []);

  // Sync editor content when editing notice
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
      const url = getApiUrl("/students/divisions");
      const response = await fetch(url, {
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
      const url = getApiUrl(`/office/notices?faculty=${facultyUsername}`);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      alert("Please fill all required fields: Title, Division, and Content.");
      return;
    }

    try {
      setLoading(true);
      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? getApiUrl(`/office/notices/${editingId}`)
        : getApiUrl("/office/notices");

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
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
      } else {
        alert("Error saving notice. Please try again.");
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      alert("Failed to submit notice to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Are you sure you want to permanently delete this notice announcement?")) {
      return;
    }

    try {
      setLoading(true);
      const url = getApiUrl(`/office/notices/${noticeId}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchNotices();
      } else {
        alert("Error deleting notice.");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      alert("Failed to delete notice.");
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

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleEditorInput = (e) => {
    setNoticeContent(e.currentTarget.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter link URL:");
    if (url) {
      applyFormat("createLink", url);
    }
  };

  const changeColor = (e) => {
    applyFormat("foreColor", e.target.value);
  };

  // Client side notice filtering
  const filteredNotices = notices.filter((notice) => {
    const search = filterSearch.toLowerCase().trim();
    const titleMatch = (notice.title || "").toLowerCase().includes(search);
    const contentMatch = (notice.content || "").toLowerCase().includes(search);
    const divMatch = filterDivision ? notice.division === filterDivision : true;

    return (titleMatch || contentMatch) && divMatch;
  });

  return (
    <ErrorBoundary>
      <div className="notices-layout-wrapper animate-fadeIn">
        
        {/* Upper Title Row */}
        <div className="notices-page-title-row">
          <div className="title-left">
            <h2>Notices & Announcements</h2>
            <span className="notices-count-badge">{filteredNotices.length} Published</span>
          </div>

          <button
            className="wizard-btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setNoticeTitle("");
              setNoticeContent("");
              setSelectedDivision("");
            }}
            disabled={loading}
          >
            Create Notice
          </button>
        </div>

        {/* Filters and search section */}
        <div className="notices-filters-card">
          <div className="filters-card-inner">
            <div className="filter-select-group">
              <select 
                value={filterDivision} 
                onChange={(e) => setFilterDivision(e.target.value)}
              >
                <option value="">All Divisions</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>Division {d}</option>
                ))}
              </select>
            </div>

            <div className="filter-right-search-action">
              <div className="search-input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="search-svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search titles, content..." 
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notices Dashboard Grid */}
        <div className="notices-grid-dashboard">
          {loading && !showForm ? (
            <div className="table-loader-state">
              <div className="loading-ring-spinner" />
              <span>Syncing notice board...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="table-empty-state">
              <div className="empty-state-icon">📢</div>
              <h4>No notices published</h4>
              <p>Post announcements to keep students informed of updates.</p>
            </div>
          ) : (
            <div className="notices-cards-grid">
              {filteredNotices.map((notice) => (
                <div key={notice._id} className="notice-announcement-card animate-fadeIn">
                  <div className="notice-card-top-row">
                    <span className="notice-audience-tag">Division {notice.division}</span>
                    <span className="notice-timestamp-label">
                      {new Date(notice.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <h3 className="notice-announcement-title">{notice.title}</h3>
                  
                  <div
                    className="notice-announcement-body office-scrollable"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />

                  <div className="notice-announcement-footer">
                    <div className="notice-author-initials">
                      <span className="author-icon">👤</span>
                      <span className="author-name">{notice.faculty || "Office Staff"}</span>
                    </div>

                    <div className="notice-card-action-triggers">
                      <button
                        className="action-link-btn"
                        onClick={() => handleEditNotice(notice)}
                        title="Edit Notice"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="action-link-btn danger"
                        onClick={() => handleDeleteNotice(notice._id)}
                        title="Delete Notice"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Notice Form Modal */}
        {showForm && (
          <div className="modal-wrapper-overlay" onClick={handleCancel}>
            <div className="modal-dialog-box size-large animate-modalScaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="modal-dialog-header">
                <h3>{editingId ? "Edit Notice Announcement" : "Publish Notice Announcement"}</h3>
                <p>Broadcast updates to student portals instantly.</p>
              </div>

              <div className="modal-dialog-body office-scrollable">
                <div className="form-input-control">
                  <label>Notice Title <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-term Exam Timetable Out"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-input-control">
                  <label>Division Target <span className="req">*</span></label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select Division</option>
                    {divisions.map((div) => (
                      <option key={div} value={div}>Division {div}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Rich Text Editor Block */}
                <div className="form-input-control">
                  <label>Notice Body <span className="req">*</span></label>
                  <div className="rich-editor-editor-card">
                    {/* Toolbar */}
                    <div className="rich-editor-toolbar-row">
                      <button type="button" onClick={() => applyFormat("bold")} title="Bold">
                        <strong>B</strong>
                      </button>
                      <button type="button" onClick={() => applyFormat("italic")} title="Italic">
                        <em>I</em>
                      </button>
                      <button type="button" onClick={() => applyFormat("underline")} title="Underline">
                        <u>U</u>
                      </button>
                      <button type="button" onClick={() => applyFormat("strikeThrough")} title="Strikethrough">
                        <s>S</s>
                      </button>
                      <div className="toolbar-divider" />
                      
                      <button type="button" onClick={() => applyFormat("insertUnorderedList")} title="Bullet List">
                        • List
                      </button>
                      <button type="button" onClick={() => applyFormat("insertOrderedList")} title="Numbered List">
                        1. List
                      </button>
                      <div className="toolbar-divider" />
                      
                      <button type="button" onClick={insertLink} title="Insert URL Link">
                        Link
                      </button>
                      
                      <input type="color" onChange={changeColor} title="Font Color" className="color-picker-input" />
                    </div>

                    {/* Contenteditable area */}
                    <div
                      ref={editorRef}
                      className="rich-editor-sheet-area office-scrollable"
                      contentEditable={!loading}
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      data-placeholder="Type announcement body details here..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button className="wizard-btn-outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
                <button className="wizard-btn-primary" onClick={handleSaveNotice} disabled={loading}>
                  {loading ? "Publishing..." : editingId ? "Update Notice" : "Publish Notice"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
};

export default NoticesPage;
