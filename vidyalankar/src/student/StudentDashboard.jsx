import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [studentInfo, setStudentInfo] = useState({
    name: "Student",
    enrollmentNo: "",
    rollNo: "",
    division: "",
    batch: ""
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Retrieve info from localStorage
    const name = localStorage.getItem("studentName") || localStorage.getItem("username") || "Student";
    const enrollmentNo = localStorage.getItem("enrollmentNo") || "";
    const rollNo = localStorage.getItem("studentRollNo") || "";
    const division = localStorage.getItem("studentDivision") || "";
    const batch = localStorage.getItem("studentBatch") || "";

    setStudentInfo({ name, enrollmentNo, rollNo, division, batch });

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
      <div className="welcome-section">
        <div className="welcome-header">
          <div className="welcome-left">
            <span className="welcome-greeting">{greeting},</span>
            <h1 className="student-display-name">{studentInfo.name}</h1>
            <div className="student-meta-badges">
              {studentInfo.enrollmentNo && (
                <span className="meta-badge">
                  <i className="bi bi-card-text me-1"></i>Enroll: {studentInfo.enrollmentNo}
                </span>
              )}
              {studentInfo.rollNo && (
                <span className="meta-badge">
                  <i className="bi bi-hash me-1"></i>Roll: {studentInfo.rollNo}
                </span>
              )}
              {studentInfo.division && (
                <span className="meta-badge">
                  <i className="bi bi-grid-3x3-gap me-1"></i>Div: {studentInfo.division}
                </span>
              )}
              {studentInfo.batch && (
                <span className="meta-badge">
                  <i className="bi bi-people me-1"></i>Batch: {studentInfo.batch}
                </span>
              )}
            </div>
          </div>
          <div className="datetime-display">
            <div className="time">{formatTime(currentTime)}</div>
            <div className="date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>
      
      {/* Hero Section with Motivational Message */}
      <div className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Student Portal</span>
          <h2>Your Academic Workspace</h2>
          <p>Easily access study materials, track test performances, and view notices.</p>
          <div className="hero-actions">
            <button className="cta-button" onClick={() => handleNavigation("/study-material")}>
              <i className="bi bi-journal-text me-1"></i>Study Material
            </button>
            <button className="cta-button secondary" onClick={() => handleNavigation("/results")}>
              <i className="bi bi-check2-square me-1"></i>View Results
            </button>
          </div>
        </div>
        <div className="hero-image">
          <i className="bi bi-mortarboard"></i>
        </div>
      </div>
      
      {/* Quick Access Cards */}
      <div className="quick-access">
        <h2>Quick Access</h2>
        <div className="cards-container">
          <div className="card" onClick={() => handleNavigation("/study-material")}>
            <i className="bi bi-book"></i>
            <span>Study Material</span>
            <small>Notes, chapters, and references</small>
          </div>
          <div className="card" onClick={() => handleNavigation("/results")}>
            <i className="bi bi-bar-chart"></i>
            <span>Results</span>
            <small>CT and exam performance</small>
          </div>
          <div className="card" onClick={() => handleNavigation("/notices")}>
            <i className="bi bi-bell"></i>
            <span>Notices</span>
            <small>Latest announcements</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;