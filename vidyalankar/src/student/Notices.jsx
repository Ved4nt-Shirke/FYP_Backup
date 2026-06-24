import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import "./StudentComponents.css";
import { noticesService } from "./services/api";

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await noticesService.getNotices();
      setNotices(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      setError("Failed to load notices. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = filter === "all" 
    ? notices 
    : notices.filter(notice => (notice.source || notice.category) === filter);

  const getCategoryIcon = (source) => {
    switch (source) {
      case "office": return "bi-building-fill";
      case "faculty": return "bi-person-workspace";
      default: return "bi-info-circle-fill";
    }
  };

  const getNoticeBadgeClass = (category) => {
    switch (category) {
      case "urgent": return "student-badge urgent";
      case "exam": return "student-badge exam";
      case "fee": return "student-badge fee";
      case "event": return "student-badge event";
      case "holiday": return "student-badge holiday";
      case "scholarship": return "student-badge scholarship";
      case "circular": return "student-badge circular";
      default: return "student-badge general";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      await noticesService.markAsRead(noticeId);
      // Update the notice locally to show it's been read
      setNotices(prevNotices => 
        prevNotices.map(notice => 
          notice._id === noticeId ? { ...notice, read: true } : notice
        )
      );
    } catch (err) {
      console.error("Failed to mark notice as read:", err);
    }
  };

  const handleDownloadAttachment = async (downloadUrl, filename) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(downloadUrl, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (!response.ok) {
        throw new Error("Access denied or file missing");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error downloading attachment:", err);
      alert("Failed to download file attachment. You may not be in the targeted list for this notice.");
    }
  };

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading notices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-content-container">
        <div className="error-container">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchNotices}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Notices & Announcements</h1>
        <p>Stay updated with the latest announcements and important notices</p>
      </div>

      <div className="notices-controls">
        <div className="filter-section">
          <label htmlFor="noticeFilter">Filter by Category:</label>
          <select 
            id="noticeFilter" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="office">Office</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>
      </div>

      {filteredNotices.length === 0 ? (
        <div className="no-notices">
          <i className="bi bi-bell"></i>
          <p>No notices found for the selected category</p>
        </div>
      ) : (
        <div className="notices-list">
          {filteredNotices.map((notice) => (
            <div key={notice._id || notice.id} className={`notice-card ${notice.read ? "read" : "unread"}`}>
              <div className="notice-header">
                <div className="notice-meta">
                  <i className={`bi ${getCategoryIcon(notice.source)}`}></i>
                  <span className="notice-source-tag">{(notice.source || 'faculty').toUpperCase()}</span>
                  <span className={getNoticeBadgeClass(notice.category)}>
                    {notice.category || "general"}
                  </span>
                  {!notice.read && (
                    <span className="notice-unread-dot" title="Unread Announcement">
                      <span className="dot"></span> New
                    </span>
                  )}
                </div>
                <span className="notice-date">{formatDate(notice.date)}</span>
              </div>
              <h3 className="notice-title">{notice.title}</h3>
              <div
                className="notice-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.content || "") }}
              ></div>

              {/* Render Secure Attachments */}
              {notice.attachments && notice.attachments.length > 0 && (
                <div className="student-notice-attachments">
                  <div className="attachments-title">
                    <i className="bi bi-paperclip"></i> Secure Attachments ({notice.attachments.length})
                  </div>
                  <div className="attachments-list">
                    {notice.attachments.map((att, idx) => {
                      let fileIcon = "bi-file-earmark-arrow-down";
                      if (att.mimetype?.includes("pdf")) fileIcon = "bi-file-earmark-pdf-fill text-danger";
                      else if (att.mimetype?.includes("image")) fileIcon = "bi-file-earmark-image-fill text-primary";
                      else if (att.mimetype?.includes("word") || att.mimetype?.includes("msword")) fileIcon = "bi-file-earmark-word-fill text-info";
                      else if (att.mimetype?.includes("excel") || att.mimetype?.includes("sheet")) fileIcon = "bi-file-earmark-excel-fill text-success";
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleDownloadAttachment(att.downloadUrl, att.filename)}
                          className="attachment-download-btn"
                          title={`Download ${att.filename}`}
                        >
                          <i className={`bi ${fileIcon}`}></i>
                          <span className="filename-text">{att.filename}</span>
                          <span className="filesize-text">({(att.size / 1024).toFixed(1)} KB)</span>
                          <i className="bi bi-download download-arrow"></i>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="notice-footer">
                <span className="notice-author">By: {notice.author}</span>
                {!notice.read && (
                  <button 
                    className="mark-as-read-btn" 
                    onClick={() => handleMarkAsRead(notice._id || notice.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="notices-summary">
        <h2>Notice Board Summary</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <i className="bi bi-bell"></i>
            <div className="stat-info">
              <span className="stat-value">{notices.length}</span>
              <span className="stat-label">Total Notices</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-exclamation-triangle"></i>
            <div className="stat-info">
              <span className="stat-value">
                {notices.filter(n => (n.source || n.category) === "office").length}
              </span>
              <span className="stat-label">Office Notices</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-calendar-event"></i>
            <div className="stat-info">
              <span className="stat-value">
                {notices.filter(n => (n.source || n.category) === "faculty").length}
              </span>
              <span className="stat-label">Faculty Notices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;