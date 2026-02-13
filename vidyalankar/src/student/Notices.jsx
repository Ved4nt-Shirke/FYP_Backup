import React, { useState, useEffect } from "react";
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
    : notices.filter(notice => notice.category === filter);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "examination": return "bi-file-earmark-text";
      case "library": return "bi-book";
      case "events": return "bi-calendar-event";
      case "administration": return "bi-building";
      case "academics": return "bi-mortarboard";
      default: return "bi-info-circle";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#f59e0b";
      case "low": return "#10b981";
      default: return "#6b7280";
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
            <option value="examination">Examinations</option>
            <option value="library">Library</option>
            <option value="events">Events</option>
            <option value="administration">Administration</option>
            <option value="academics">Academics</option>
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
            <div key={notice._id || notice.id} className="notice-card">
              <div className="notice-header">
                <div className="notice-meta">
                  <i className={`bi ${getCategoryIcon(notice.category)}`}></i>
                  <span className="notice-category">{notice.category}</span>
                  <span 
                    className="notice-priority" 
                    style={{ color: getPriorityColor(notice.priority) }}
                  >
                    {notice.priority} priority
                  </span>
                </div>
                <span className="notice-date">{formatDate(notice.date)}</span>
              </div>
              <h3 className="notice-title">{notice.title}</h3>
              <p className="notice-content">{notice.content}</p>
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
                {notices.filter(n => n.priority === "high").length}
              </span>
              <span className="stat-label">High Priority</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-calendar-event"></i>
            <div className="stat-info">
              <span className="stat-value">
                {notices.filter(n => n.category === "events").length}
              </span>
              <span className="stat-label">Events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;