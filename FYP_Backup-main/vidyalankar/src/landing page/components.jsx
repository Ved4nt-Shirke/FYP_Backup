import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { TokenManager, SessionManager } from "../utils/authUtils";

// Assets imports
import vpLogo from "./assets/vp_ciaan_logo_full.png";
import heroImg from "./assets/teacher_student_hero.png";
import attendanceImg from "./assets/feature_attendance.png";
import assessmentImg from "./assets/feature_assessment.png";
import examsImg from "./assets/feature_exams.png";
import complianceImg from "./assets/feature_compliance.png";
import botImg from "./assets/whatsapp_bot.png";
import collegeBuildingImg from "./assets/college_building.png";

// Helper to check if user has active session
const isUserLoggedIn = () => {
  const token = TokenManager.getToken();
  const isSessionActive = SessionManager.isSessionActive();
  return !!(token && isSessionActive);
};

export const LandingHeader = () => {
  const isLoggedIn = isUserLoggedIn();

  return (
    <header className="lp-header">
      <div className="lp-nav-container">
        <Link to="/" className="lp-logo-area">
          <img src={vpLogo} alt="VP Logo" className="lp-logo" />
          <span className="lp-logo-text">CIAAN</span>
          <span className="lp-logo-tag">Portal</span>
        </Link>
        <div className="lp-nav-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="lp-btn-login">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/login" className="lp-btn-login">
              Portal Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export const LandingHero = () => {
  const isLoggedIn = isUserLoggedIn();

  return (
    <section className="lp-hero-section">
      <div className="lp-hero-container">
        <div className="lp-hero-content">
          <span className="lp-hero-badge">Vidyalankar Polytechnic</span>
          <h1 className="lp-hero-title">
            Continuous Internal <span>Assessment & Analysis</span>
          </h1>
          <p className="lp-hero-description">
            A comprehensive, digital academic management portal designed for Vidyalankar Polytechnic. Seamlessly track student attendance, maintain progressive assessment sheets, organize mock & practical examinations, and automate MSBTE compliance formats.
          </p>
          <div className="lp-hero-ctas">
            {isLoggedIn ? (
              <Link to="/dashboard" className="lp-btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="lp-btn-primary">
                Login to Portal
              </Link>
            )}
            <a href="https://vpt.edu.in" target="_blank" rel="noopener noreferrer" className="lp-btn-secondary">
              About Vidyalankar
            </a>
          </div>
        </div>
        <div className="lp-hero-image-area">
          <img src={heroImg} alt="VP CIAAN Portal Hero" className="lp-hero-image" />
        </div>
      </div>
    </section>
  );
};

export const LandingFeatures = () => {
  const featuresList = [
    {
      title: "Smart Attendance Hub",
      text: "Track, edit, and view theory, practical batch sessions, and tutorial attendances. Auto-compute attendance ratios and track defaulter thresholds.",
      image: attendanceImg,
      icon: "📊"
    },
    {
      title: "Continuous Assessments",
      text: "Record and manage Progressive Assessments (PA). Enter experiment marks, microproject ratings, and term work values smoothly.",
      image: assessmentImg,
      icon: "📝"
    },
    {
      title: "Exams & Mock Tests",
      text: "Conduct online mock MCQ exams, enable and manage practical question sheets, view student uploads, and grade student submissions.",
      image: examsImg,
      icon: "🎯"
    },
    {
      title: "MSBTE Compliance",
      text: "Generate pre-formatted MSBTE reports (K3, K4, K5, K7, K8, K9) in a single click, ready for printing and continuous audit inspections.",
      image: complianceImg,
      icon: "📄"
    },
    {
      title: "WhatsApp Bot Alerts",
      text: "Send automated updates, attendance alerts, and critical academic announcements to students and parents through direct messages.",
      image: botImg,
      icon: "💬"
    }
  ];

  return (
    <section className="lp-features-section" id="features">
      <div className="lp-section-header">
        <span className="lp-section-tag">Key Modules</span>
        <h2 className="lp-section-title">Academic Capabilities Engineered for VP</h2>
        <p className="lp-section-desc">
          Simplifying documentation, increasing transparency, and empowering teachers with robust, automated tools.
        </p>
      </div>
      <div className="lp-features-grid">
        {featuresList.map((feat, index) => (
          <div key={index} className="lp-feature-card">
            <div className="lp-feature-img-container">
              <img src={feat.image} alt={feat.title} className="lp-feature-img" />
            </div>
            <div className="lp-feature-icon">{feat.icon}</div>
            <h3 className="lp-feature-title">{feat.title}</h3>
            <p className="lp-feature-text">{feat.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const LandingAbout = () => {
  return (
    <section className="lp-about-section">
      <div className="lp-about-container">
        <div className="lp-about-img-area">
          <img src={collegeBuildingImg} alt="Vidyalankar Polytechnic Campus" className="lp-about-img" />
        </div>
        <div className="lp-about-content">
          <span className="lp-section-tag">Our Institution</span>
          <h2 className="lp-about-title">Vidyalankar Polytechnic</h2>
          <p className="lp-about-text">
            Vidyalankar Polytechnic, established in 2002, is a premier institute approved by AICTE, recognized by the Government of Maharashtra, and affiliated with MSBTE.
          </p>
          <p className="lp-about-text">
            Our mission is to produce technically competent professionals with high ethical standards. The CIAAN system helps automate academic reporting, aligning our continuous evaluations with the high standards of the MSBTE curriculum.
          </p>
          <div className="lp-about-stats">
            <div className="lp-stat-box">
              <span className="lp-stat-num">2002</span>
              <span className="lp-stat-lbl">Established</span>
            </div>
            <div className="lp-stat-box">
              <span className="lp-stat-num">AICTE</span>
              <span className="lp-stat-lbl">Approved</span>
            </div>
            <div className="lp-stat-box">
              <span className="lp-stat-num">100%</span>
              <span className="lp-stat-lbl">Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const LandingFooter = () => {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-container">
        <div className="lp-footer-about">
          <span className="lp-footer-logo-text">VP CIAAN Portal</span>
          <p className="lp-footer-desc">
            An internal portal for Vidyalankar Polytechnic to automate attendance, internal assessments, and academic audits.
          </p>
        </div>
        <div className="lp-footer-links-col">
          <h4 className="lp-footer-title">Institutional Portals</h4>
          <ul className="lp-footer-links">
            <li>
              <a href="https://vpt.edu.in" target="_blank" rel="noopener noreferrer" className="lp-footer-link">
                VP Website
              </a>
            </li>
            <li>
              <a href="https://msbte.org.in" target="_blank" rel="noopener noreferrer" className="lp-footer-link">
                MSBTE Portal
              </a>
            </li>
          </ul>
        </div>
        <div className="lp-footer-links-col">
          <h4 className="lp-footer-title">Support & Contact</h4>
          <p className="lp-footer-desc" style={{ fontSize: "0.9rem", margin: 0 }}>
            Vidyalankar Educational Campus,<br />
            Wadala (E), Mumbai - 400 037.<br />
            Email: principal@vpt.edu.in
          </p>
        </div>
      </div>
      <div className="lp-footer-bottom">
        <p>&copy; {new Date().getFullYear()} Vidyalankar Polytechnic. All rights reserved.</p>
        <div className="lp-footer-bottom-links">
          <a href="#" className="lp-footer-link">Privacy Policy</a>
          <a href="#" className="lp-footer-link">Terms of Use</a>
        </div>
      </div>
    </footer>
  );
};
