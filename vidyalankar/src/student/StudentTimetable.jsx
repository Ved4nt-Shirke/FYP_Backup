import React, { useEffect, useState } from "react";
import "./StudentComponents.css";
import { studentTimetableService } from "./services/api";

const StudentTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [timetable, setTimetable] = useState(null);

  const loadTimetable = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await studentTimetableService.getCurrent();
      setVisible(Boolean(data?.visible));
      setMessage(data?.message || "");
      setAvailableFrom(data?.availableFrom || "");
      setTimetable(data?.timetable || null);
    } catch (err) {
      setError("Unable to load timetable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const openFile = async () => {
    if (!timetable?._id) {
      return;
    }

    try {
      const blob = await studentTimetableService.openFile(timetable._id);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (_err) {
      setError("Unable to open timetable file.");
    }
  };

  if (loading) {
    return (
      <div className="student-content-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading timetable...</p>
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
          <button className="retry-btn" onClick={loadTimetable}>Retry</button>
        </div>
      </div>
    );
  }

  if (!visible || !timetable) {
    return (
      <div className="student-content-container">
        <div className="content-header">
          <h1>Timetable</h1>
          <p>Division timetable will be available here once your semester ends.</p>
        </div>
        <div className="no-results">
          <i className="bi bi-calendar-x"></i>
          <p>{message || "No timetable is available for your division right now."}</p>
          {availableFrom ? (
            <p style={{ marginTop: 8 }}>
              Available from: {new Date(availableFrom).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="student-content-container">
      <div className="content-header">
        <h1>Timetable</h1>
        <p>Published by faculty for your division after semester completion.</p>
      </div>

      <div className="performance-summary" style={{ marginTop: 16 }}>
        <h2>{timetable.title || "Class Timetable"}</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <i className="bi bi-diagram-3"></i>
            <div className="stat-info">
              <span className="stat-value">{timetable.divisionId?.name || timetable.divisionName || "-"}</span>
              <span className="stat-label">Division</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-journal"></i>
            <div className="stat-info">
              <span className="stat-value">{timetable.courseId?.courseCode || "-"}</span>
              <span className="stat-label">Course</span>
            </div>
          </div>
          <div className="stat-card">
            <i className="bi bi-calendar-event"></i>
            <div className="stat-info">
              <span className="stat-value">{new Date(timetable.semesterEndDate).toLocaleDateString()}</span>
              <span className="stat-label">Semester End</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="retry-btn" style={{ backgroundColor: "#2563eb" }} onClick={openFile}>
            Open Timetable File
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
