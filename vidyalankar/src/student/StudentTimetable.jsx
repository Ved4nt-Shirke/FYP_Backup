import React, { useEffect, useState, useRef } from "react";
import "./StudentComponents.css";
import "./StudentDashboard.css";
import { studentTimetableService } from "./services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  { start: "09:00 AM", end: "10:00 AM", label: "09:00 - 10:00" },
  { start: "10:00 AM", end: "11:00 AM", label: "10:00 - 11:00" },
  { start: "11:15 AM", end: "12:15 PM", label: "11:15 - 12:15" },
  { start: "12:15 PM", end: "01:15 PM", label: "12:15 - 01:15" },
  { start: "02:00 PM", end: "03:00 PM", label: "02:00 - 03:00" },
  { start: "03:00 PM", end: "04:00 PM", label: "03:00 - 04:00" },
];

const MOCK_LECTURES = {
  Monday: [
    { subject: "Java Programming", code: "JV101", room: "Lab 3", faculty: "Prof. S. Rane", time: "09:00 AM - 10:00 AM", color: "#3b82f6" },
    { subject: "Database Systems", code: "DB302", room: "Room 402", faculty: "Dr. A. Joshi", time: "10:00 AM - 11:00 AM", color: "#10b981" },
    { subject: "Web Technologies", code: "WT205", room: "Lab 5", faculty: "Prof. K. Shah", time: "11:15 AM - 12:15 PM", color: "#ec4899" },
    { subject: "Applied Mathematics", code: "AM102", room: "Room 402", faculty: "Dr. R. Patil", time: "12:15 PM - 01:15 PM", color: "#f59e0b" },
  ],
  Tuesday: [
    { subject: "Software Engineering", code: "SE204", room: "Room 403", faculty: "Prof. N. Sen", time: "09:00 AM - 10:00 AM", color: "#8b5cf6" },
    { subject: "Java Programming", code: "JV101", room: "Lab 3", faculty: "Prof. S. Rane", time: "10:00 AM - 11:00 AM", color: "#3b82f6" },
    { subject: "Computer Networks", code: "CN401", room: "Room 403", faculty: "Prof. M. Roy", time: "02:00 PM - 03:00 PM", color: "#ef4444" },
    { subject: "Database Systems", code: "DB302", room: "Room 402", faculty: "Dr. A. Joshi", time: "03:00 PM - 04:00 PM", color: "#10b981" },
  ],
  Wednesday: [
    { subject: "Computer Networks", code: "CN401", room: "Room 403", faculty: "Prof. M. Roy", time: "09:00 AM - 10:00 AM", color: "#ef4444" },
    { subject: "Web Technologies", code: "WT205", room: "Lab 5", faculty: "Prof. K. Shah", time: "10:00 AM - 11:00 AM", color: "#ec4899" },
    { subject: "Software Engineering", code: "SE204", room: "Room 403", faculty: "Prof. N. Sen", time: "11:15 AM - 12:15 PM", color: "#8b5cf6" },
  ],
  Thursday: [
    { subject: "Applied Mathematics", code: "AM102", room: "Room 402", faculty: "Dr. R. Patil", time: "09:00 AM - 10:00 AM", color: "#f59e0b" },
    { subject: "Java Programming", code: "JV101", room: "Room 402", faculty: "Prof. S. Rane", time: "10:00 AM - 11:00 AM", color: "#3b82f6" },
    { subject: "Computer Networks", code: "CN401", room: "Lab 2", faculty: "Prof. M. Roy", time: "11:15 AM - 12:15 PM", color: "#ef4444" },
  ],
  Friday: [
    { subject: "Database Systems", code: "DB302", room: "Lab 4", faculty: "Dr. A. Joshi", time: "09:00 AM - 10:00 AM", color: "#10b981" },
    { subject: "Web Technologies", code: "WT205", room: "Room 402", faculty: "Prof. K. Shah", time: "10:00 AM - 11:00 AM", color: "#ec4899" },
    { subject: "Applied Mathematics", code: "AM102", room: "Room 402", faculty: "Dr. R. Patil", time: "02:00 PM - 03:00 PM", color: "#f59e0b" },
  ],
  Saturday: [
    { subject: "Project Lab", code: "PRJ400", room: "Lab 6", faculty: "Prof. A. Kulkarni", time: "09:00 AM - 11:00 AM", color: "#6366f1" },
  ]
};

const StudentTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [timetableResponse, setTimetableResponse] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState(""); // pdf, image, other
  const [currentTime, setCurrentTime] = useState(new Date());

  const fileUrlRef = useRef("");

  useEffect(() => {
    fileUrlRef.current = fileUrl;
  }, [fileUrl]);

  // Tick clock every second for live date/time display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toMinutes = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const getOngoingLecture = () => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysOfWeek[currentTime.getDay()];
    
    const activeDayName = currentDay === "Sunday" ? "Monday" : currentDay;
    const dayLectures = MOCK_LECTURES[activeDayName] || [];

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let ongoing = null;

    dayLectures.forEach((lec) => {
      const [startStr, endStr] = lec.time.split(" - ");
      const startMin = toMinutes(startStr);
      const endMin = toMinutes(endStr);

      if (nowMinutes >= startMin && nowMinutes < endMin) {
        ongoing = lec;
      }
    });

    return { ongoing, activeDayName };
  };

  const loadTimetable = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await studentTimetableService.getCurrent();
      setTimetableResponse(data);
      setVisible(Boolean(data?.visible));
      setMessage(data?.message || "");
      setAvailableFrom(data?.availableFrom || "");
      setTimetable(data?.timetable || null);

      if (data?.visible && data?.timetable?._id) {
        const blob = await studentTimetableService.openFile(data.timetable._id);
        const blobUrl = URL.createObjectURL(blob);
        setFileUrl(blobUrl);

        if (blob.type === "application/pdf") {
          setFileType("pdf");
        } else if (blob.type.startsWith("image/")) {
          setFileType("image");
        } else {
          setFileType("other");
        }
      }
    } catch (err) {
      setError("Unable to load timetable right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
    
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
  };

  const formatDay = (date) => {
    return date.toLocaleDateString([], { weekday: "long" });
  };

  const getAcademicYear = (date) => {
    return date.getFullYear();
  };



  const studentInfo = timetableResponse?.student || {
    className: "CO3KA",
    division: "b",
    year: "First Year"
  };

  if (loading) {
    return (
      <div className="timetable-dashboard-layout-full loading-state-container">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
        <div className="skeleton-grid-box skeleton"></div>
        <style>{`
          .loading-state-container {
            width: 100% !important;
            padding: 24px;
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
          }
          .skeleton {
            background: #e2e8f0;
            border-radius: 8px;
            animation: pulse 1.5s infinite ease-in-out;
          }
          .skeleton-line {
            background: #e2e8f0;
            border-radius: 4px;
            animation: pulse 1.5s infinite ease-in-out;
          }
          .skeleton-title {
            width: 180px;
            height: 32px;
            margin-bottom: 12px;
          }
          .skeleton-subtitle {
            width: 320px;
            height: 16px;
            margin-bottom: 32px;
          }
          .skeleton-grid-box {
            width: 100%;
            height: 400px;
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="timetable-dashboard-layout-full">
      
      {/* 1. TOP METADATA ROW: Time, Date, Day, Year, Class (100% Width) */}
      <div className="timetable-meta-grid">
        <div className="meta-info-card class-card-grad">
          <span className="meta-label">CLASS / DIVISION</span>
          <span className="meta-value">{studentInfo.className} - Div {studentInfo.division}</span>
        </div>
        <div className="meta-info-card">
          <span className="meta-label">ACADEMIC YEAR</span>
          <span className="meta-value">{studentInfo.year} ({getAcademicYear(currentTime)})</span>
        </div>
        <div className="meta-info-card">
          <span className="meta-label">CURRENT DAY</span>
          <span className="meta-value">{formatDay(currentTime)}</span>
        </div>
        <div className="meta-info-card">
          <span className="meta-label">TODAY'S DATE</span>
          <span className="meta-value">{formatDate(currentTime)}</span>
        </div>
        <div className="meta-info-card clock-card">
          <span className="meta-label">LIVE CLOCK</span>
          <span className="meta-value">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTENT: stretching to 100% width */}
      <div className="timetable-main-panel-full">
        
        {/* Header toolbar */}
        <div className="timetable-panel-header">
          <div className="title-area">
            <h1>
              <i className="bi bi-calendar3-event icon-grad"></i> Timetable Planner
            </h1>
            <p className="subtitle">
              {visible && timetable
                ? `Official Class Schedule for Course ${timetable.courseId?.courseCode || studentInfo.className}`
                : "Continuous academic monitor and lecture schedule portal"}
            </p>
          </div>
          
          <div className="action-toolbar">
            {visible && timetable && fileUrl && (
              <a href={fileUrl} download={timetable.fileName || "timetable"} className="dashboard-cta-btn btn-outline-custom">
                <i className="bi bi-cloud-arrow-down-fill text-primary"></i> Download official PDF
              </a>
            )}
          </div>
        </div>

        {/* Workspace Body */}
        {!visible || !timetable ? (
          /* Premium 100% Wide Empty State */
          <div className="timetable-empty-card">
            <div className="empty-decor-bg"></div>
            <div className="empty-content-wrapper">
              <div className="empty-icon-circle animate-float">
                <i className="bi bi-calendar2-x"></i>
              </div>
              <h2>No Timetable Published</h2>
              <p>
                Your division <strong>{studentInfo.className} ({studentInfo.division})</strong> timetable has not been uploaded or published by the department head.
              </p>
              {availableFrom && (
                <span className="available-badge">
                  <i className="bi bi-clock-history"></i> Available from: {new Date(availableFrom).toLocaleDateString()}
                </span>
              )}
              <div className="empty-actions">
                <button className="dashboard-cta-btn btn-primary-grad" onClick={loadTimetable}>
                  <i className="bi bi-arrow-clockwise"></i> Refresh Status
                </button>
                <a href="mailto:academic@polytechnic.edu" className="dashboard-cta-btn btn-outline-custom">
                  <i className="bi bi-envelope"></i> Contact Coordinator
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Active Timetable Views */
          <div className="timetable-view-content">
            <div className="timetable-official-embed">
              {fileType === "pdf" ? (
                <iframe
                  src={`${fileUrl}#toolbar=0`}
                  title="Official Timetable Sheet"
                  className="timetable-doc-iframe"
                ></iframe>
              ) : fileType === "image" ? (
                <div className="timetable-image-scroller">
                  <img src={fileUrl} alt="Class Timetable Sheet" className="timetable-sheet-img" />
                </div>
              ) : (
                <div className="timetable-fallback-card">
                  <i className="bi bi-file-earmark-zip"></i>
                  <p>Direct preview is unavailable for this file format.</p>
                  <a href={fileUrl} download={timetable.fileName || "timetable"} className="dashboard-cta-btn btn-primary-grad">
                    <i className="bi bi-download"></i> Download File ({Math.round(timetable.fileSize / 1024)} KB)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded CSS overrides to enforce 100% page width */}
      <style>{`
        /* FOOLPROOF LAYOUT OVERRIDES: Forces parents to take absolute 100% of the screen width */
        @media (min-width: 769px) {
          .student-main-content {
            width: calc(100% - 270px) !important;
            max-width: calc(100% - 270px) !important;
            flex: 1 1 auto !important;
          }
        }
        
        .student-page-content {
          width: 100% !important;
          max-width: 100% !important;
          padding: 20px !important;
          box-sizing: border-box !important;
        }

        .student-dashboard {
          width: 100% !important;
          max-width: 100% !important;
        }

        .student-app-container {
          width: 100% !important;
          max-width: 100% !important;
        }

        .timetable-dashboard-layout-full {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 0 24px 0 !important;
          box-sizing: border-box !important;
        }

        /* 1. Metadata Grid row (Enlarged and spaced) */
        .timetable-meta-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          width: 100% !important;
          max-width: 100% !important;
        }

        .meta-info-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
          transition: all 0.2s ease;
        }

        .meta-info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
          border-color: #94a3b8;
        }

        .class-card-grad {
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%) !important;
          border-color: #93c5fd !important;
        }

        .clock-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%) !important;
          border-color: #86efac !important;
        }

        .meta-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .meta-value {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .class-card-grad .meta-value {
          color: #1d4ed8;
        }

        .clock-card .meta-value {
          color: #166534;
          font-family: monospace;
        }

        /* 2. Main Workspace Panel */
        .timetable-main-panel-full {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 18px;
          box-shadow: 0 6px 24px rgba(15, 23, 42, 0.03);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        /* Toolbar / Header */
        .timetable-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 20px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .timetable-panel-header h1 {
          margin: 0;
          font-size: 1.85rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .icon-grad {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .timetable-panel-header .subtitle {
          margin: 6px 0 0 0;
          font-size: 0.94rem;
          color: #64748b;
          font-weight: 500;
        }

        .action-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Mode Selector Tabs */
        .view-mode-selector {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 2px;
        }

        .mode-btn {
          border: none;
          background: transparent;
          padding: 8px 18px;
          font-size: 0.84rem;
          font-weight: 750;
          color: #64748b;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .mode-btn.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        /* Empty State */
        .timetable-empty-card {
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          padding: 96px 32px;
          text-align: center;
          overflow: hidden;
          min-height: calc(100vh - 320px);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          box-sizing: border-box;
        }

        .empty-decor-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(124, 58, 237, 0.03) 0%, transparent 40%);
          pointer-events: none;
        }

        .empty-content-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 540px;
        }

        .empty-icon-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          color: #94a3b8;
          margin-bottom: 28px;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        .timetable-empty-card h2 {
          font-size: 1.65rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .timetable-empty-card p {
          font-size: 1.05rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .available-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 28px;
        }

        .empty-actions {
          display: flex;
          gap: 14px;
          justify-content: center;
          width: 100%;
        }

        .dashboard-cta-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 750;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary-grad {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-primary-grad:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }

        .btn-outline-custom {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .btn-outline-custom:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* Day Navigation */
        .day-navigation {
          display: flex;
          width: 100%;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 6px;
          gap: 6px;
          overflow-x: auto;
        }

        .day-nav-btn {
          flex: 1;
          border: none;
          background: transparent;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .day-nav-btn.active {
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #cbd5e1;
        }

        .day-nav-btn .day-name {
          font-weight: 800;
          font-size: 0.86rem;
          color: #64748b;
        }

        .day-nav-btn.active .day-name {
          color: #2563eb;
        }

        .day-nav-btn .lecture-badge {
          font-size: 0.68rem;
          font-weight: 800;
          background: #cbd5e1;
          color: #475569;
          padding: 2px 7px;
          border-radius: 99px;
        }

        .day-nav-btn.active .lecture-badge {
          background: #2563eb;
          color: #ffffff;
        }

        /* Lectures Day List (100% Width) */
        .lectures-schedule-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 10px;
        }

        .lecture-schedule-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          display: flex;
          padding: 24px;
          gap: 30px;
          overflow: hidden;
          transition: all 0.22s;
          width: 100%;
          box-sizing: border-box;
        }

        .lecture-schedule-card:hover {
          transform: translateX(4px);
          border-color: color-mix(in srgb, var(--subject-color) 40%, #e2e8f0);
          box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }

        .card-accent-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
        }

        .lecture-time-column {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 150px;
          border-right: 1px solid #e2e8f0;
          padding-right: 20px;
        }

        .lecture-time-column .lec-time {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .lecture-time-column .lec-duration {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 3px;
        }

        .lecture-details-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
        }

        .subject-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .subject-row h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .subject-code-badge {
          font-size: 0.76rem;
          font-weight: 750;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .live-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          background: #ecfdf5;
          color: #059669;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid #10b981;
        }

        .live-dot-pulse {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-dot 1.2s infinite ease-in-out;
        }

        .ongoing-card-glowing {
          border-color: #10b981 !important;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.08);
          background: linear-gradient(90deg, #ffffff 0%, #f4fbf7 100%);
        }

        .meta-row {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          font-size: 0.92rem;
          color: #64748b;
          font-weight: 550;
        }

        .meta-row i {
          margin-right: 6px;
          color: #94a3b8;
        }

        .no-lectures-box {
          padding: 80px;
          text-align: center;
          background: #f8fafc;
          border-radius: 12px;
          color: #94a3b8;
        }

        .no-lectures-box i {
          font-size: 3.5rem;
        }

        /* Weekly Grid Table (100% width grid) */
        .timetable-week-grid-container {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }

        .timetable-grid-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }

        .timetable-grid-table th {
          background: #f8fafc;
          border-bottom: 1px solid #cbd5e1;
          padding: 16px 20px;
          font-weight: 850;
          color: #334155;
        }

        .timetable-grid-table td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px 20px;
          vertical-align: middle;
        }

        .time-label {
          background: #f8fafc;
          color: #0f172a;
          font-weight: 800;
        }

        .empty-grid-cell {
          color: #cbd5e1;
          font-style: italic;
          font-weight: 500;
        }

        .lecture-grid-cell {
          background: color-mix(in srgb, var(--grid-accent) 4%, #ffffff);
          border-left: 3.5px solid var(--grid-accent);
        }

        .grid-sub-name {
          font-weight: 850;
          color: #0f172a;
          display: block;
        }

        .grid-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 6px;
        }

        /* Document Embed View */
        .timetable-official-embed {
          width: 100%;
          min-height: 650px;
          height: calc(100vh - 240px);
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          overflow: hidden;
        }

        .timetable-doc-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Responsive */
        @media (max-width: 1120px) {
          .timetable-meta-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .timetable-meta-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .empty-actions {
            flex-direction: column;
          }
          .lecture-schedule-card {
            flex-direction: column;
            gap: 16px;
          }
          .lecture-time-column {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            padding-right: 0;
            padding-bottom: 10px;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentTimetable;
