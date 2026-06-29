import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  noticesService,
  studyMaterialsService,
  mockTestsService
} from "./services/api";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({
    materials: 0,
    exams: 0,
    notices: 0
  });
  const [latestNotices, setLatestNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get student info from localStorage
  const studentName =
    localStorage.getItem("studentName") ||
    localStorage.getItem("username") ||
    "Student";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, [currentTime]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [materialsResult, mockTestsResult, noticesResult] = await Promise.allSettled([
          studyMaterialsService.getMaterials(),
          mockTestsService.getTests(),
          noticesService.getNotices()
        ]);

        let materialsCount = 0;
        let examsCount = 0;
        let noticesCount = 0;
        let noticesList = [];

        if (materialsResult.status === "fulfilled") {
          materialsCount = Array.isArray(materialsResult.value) ? materialsResult.value.length : 0;
        }
        if (mockTestsResult.status === "fulfilled") {
          examsCount = Array.isArray(mockTestsResult.value) ? mockTestsResult.value.length : 0;
        }
        if (noticesResult.status === "fulfilled") {
          const list = Array.isArray(noticesResult.value) ? noticesResult.value : [];
          noticesCount = list.length;
          // Sort by date descending and take top 3
          noticesList = [...list]
            .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
            .slice(0, 3);
        }

        setStats({
          materials: materialsCount,
          exams: examsCount,
          notices: noticesCount
        });
        setLatestNotices(noticesList);
      } catch (error) {
        console.error("Error loading student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="student-dashboard-content">
      {/* Left / Main Column */}
      <div className="dashboard-main-col">
        {/* Welcome Section */}
        <div className="welcome-section-modern">
          <div className="welcome-info">
            <span className="welcome-emoji">👋</span>
            <div>
              <h1>{greeting}, {studentName}!</h1>
              <p>Here is what's happening with your academics today.</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item" onClick={() => handleNavigation("/study-material")}>
            <div className="stat-icon-wrapper materials">
              <i className="bi bi-book"></i>
            </div>
            <div className="stat-details">
              <span className="stat-value">{loading ? "..." : stats.materials}</span>
              <span className="stat-label">Study Materials</span>
            </div>
          </div>

          <div className="stat-item" onClick={() => handleNavigation("/mock-exams")}>
            <div className="stat-icon-wrapper exams">
              <i className="bi bi-clipboard2-pulse"></i>
            </div>
            <div className="stat-details">
              <span className="stat-value">{loading ? "..." : stats.exams}</span>
              <span className="stat-label">Active Mock Exams</span>
            </div>
          </div>

          <div className="stat-item" onClick={() => handleNavigation("/notices")}>
            <div className="stat-icon-wrapper notices">
              <i className="bi bi-bell"></i>
            </div>
            <div className="stat-details">
              <span className="stat-value">{loading ? "..." : stats.notices}</span>
              <span className="stat-label">Active Notices</span>
            </div>
          </div>
        </div>

        {/* Hero Section Banner */}
        <div className="hero-section-modern">
          <div className="hero-content">
            <span className="hero-badge">Workspace</span>
            <h2>Stay ahead with focused study and smart practice</h2>
            <p>Access study material, mock exams, and view your results easily.</p>
            <div className="hero-actions">
              <button className="cta-btn-modern" onClick={() => handleNavigation("/study-material")}>
                Open Study Material
              </button>
              <button className="cta-btn-modern secondary" onClick={() => handleNavigation("/results")}>
                View Results
              </button>
            </div>
          </div>
          <div className="hero-illustration">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="quick-access-modern">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => handleNavigation("/study-material")}>
              <i className="bi bi-folder-fill text-primary-icon"></i>
              <h3>Study Material</h3>
              <p>Access and download notes, references, and files.</p>
            </div>
            <div className="action-card" onClick={() => handleNavigation("/results")}>
              <i className="bi bi-bar-chart-line-fill text-success-icon"></i>
              <h3>Results</h3>
              <p>Check class tests, practicals, and term reports.</p>
            </div>
            <div className="action-card" onClick={() => handleNavigation("/timetable")}>
              <i className="bi bi-calendar-event-fill text-warning-icon"></i>
              <h3>Timetable</h3>
              <p>View your class schedules and lectures.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right / Sidebar Column */}
      <div className="dashboard-side-col">
        {/* Date Time Widget */}
        <div className="widget-card datetime-widget">
          <div className="widget-header-icon">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="time-val">{formatTime(currentTime)}</div>
          <div className="date-val">{formatDate(currentTime)}</div>
        </div>

        {/* Recent Notices Widget */}
        <div className="widget-card notices-widget">
          <div className="widget-header">
            <h3>Recent Notices</h3>
            <button className="view-all-link" onClick={() => handleNavigation("/notices")}>
              View All <i className="bi bi-arrow-right-short"></i>
            </button>
          </div>
          <div className="notices-mini-list">
            {loading ? (
              <div className="loading-state">Loading notices...</div>
            ) : latestNotices.length > 0 ? (
              latestNotices.map((notice) => (
                <div key={notice._id || notice.id} className="notice-mini-item" onClick={() => handleNavigation("/notices")}>
                  <div className="notice-meta">
                    <span className={`notice-badge-mini ${notice.category || 'general'}`}>
                      {notice.category || 'general'}
                    </span>
                    <span className="notice-time">
                      {notice.createdAt || notice.date ? new Date(notice.createdAt || notice.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h4 className="notice-title-mini">{notice.title}</h4>
                  <p className="notice-desc-mini">
                    Issued by: <strong style={{textTransform: 'capitalize'}}>{notice.source || 'Institution'}</strong>
                  </p>
                </div>
              ))
            ) : (
              <div className="empty-state-mini">
                <i className="bi bi-info-circle"></i>
                <p>No recent notices found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;