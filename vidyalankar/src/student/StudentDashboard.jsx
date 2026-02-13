import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

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
          <div>
            <h1>{greeting}, Student!</h1>
            <p>Welcome back to your learning dashboard</p>
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
          <h2>Ready to Learn Something New Today?</h2>
          <p>Explore your courses, take practice tests, and track your progress</p>
          <button className="cta-button" onClick={() => handleNavigation("/study-material")}>
            Get Started
          </button>
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
          </div>
          <div className="card" onClick={() => handleNavigation("/elibrary/coursewise")}>
            <i className="bi bi-bookshelf"></i>
            <span>E-library</span>
          </div>
          <div className="card" onClick={() => handleNavigation("/mock-test/exam-list")}>
            <i className="bi bi-laptop"></i>
            <span>Mock Tests</span>
          </div>
          <div className="card" onClick={() => handleNavigation("/results")}>
            <i className="bi bi-bar-chart"></i>
            <span>Results</span>
          </div>
          <div className="card" onClick={() => handleNavigation("/notices")}>
            <i className="bi bi-bell"></i>
            <span>Notices</span>
          </div>
        </div>
      </div>
      


      


    </div>
  );
};

export default StudentDashboard;