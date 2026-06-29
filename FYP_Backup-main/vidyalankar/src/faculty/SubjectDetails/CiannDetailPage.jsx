import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../basic/Header';
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from '../../utils/institutionBranding';

const CiannDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ciannData } = location.state || {};

  const onBackToList = () => {
    navigate('/edit-ciann');
  };

  if (!ciannData || !ciannData.ciannId) {
    return <p>No CIAAN data to display. Please select a CIAAN from the Edit page.</p>;
  }

  const username = localStorage.getItem('username') || 'Mr. Test User';
  const institutionCode = (localStorage.getItem('institutionCode') || localStorage.getItem('college') || 'VP').toUpperCase();
  const institutionName = localStorage.getItem('institutionName') || institutionCode;
  const institutionLogoUrl = buildInstitutionLogoUrl(localStorage.getItem('institutionLogoUrl') || '');
  const institutionFallback = getInstitutionInitials(institutionName, institutionCode);

  return (
    <div className="ciann-detail-page-container">
      <Header />
      <div className="page-content-wrapper">
        {/* Sidebar with Dashboard Navigation */}
        <div className="sidebar">
          <div className="sidebar-header">VP Polytechnic</div>
          <ul>
            <li><a href="#" onClick={() => navigate('/dashboard')}>Dashboard</a></li>
            <li>
              <a href="#" onClick={() => navigate('/edit-ciann')}>CIAAN</a>
              <ul>
                <li><a href="#">Front Page</a></li>
                <li><a href="#">Time Table & Load</a></li>
                <li><a href="#">Syllabus Contents</a></li>
                <li><a href="#">Subject Details</a></li>
                <li><a href="#">Students List</a></li>
                <li><a href="#">Teaching Plan (TP)</a></li>
                <li><a href="#">Laboratory Plan (LP)</a></li>
              </ul>
            </li>
            <li><a href="#">Assessment</a></li>
            <li><a href="#">PT / Micro Project</a></li>
            <li><a href="#">Micro Project</a></li>
            <li><a href="#">MSBTE Formats</a></li>
            <li><a href="#">Practical Exam</a></li>
            <li><a href="#">Mock Exams</a></li>
          </ul>
        </div>

        {/* Main Detail Area */}
        <div className="main-detail-area">
          <div className="college-logo-header">
            {institutionLogoUrl ? (
              <img src={institutionLogoUrl} alt="College Logo" style={{ height: '40px', width: '40px', borderRadius: '8px', objectFit: 'cover', marginRight: '10px' }} />
            ) : (
              <span
                style={{
                  height: '40px',
                  width: '40px',
                  borderRadius: '8px',
                  marginRight: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#e5e7eb',
                  fontWeight: 'bold',
                }}
              >
                {institutionFallback}
              </span>
            )}
            <span style={{ fontWeight: 'bold' }}>{institutionName}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>COURSE DIARY</span>
          </div>

          <div className="ciann-main-info">
            <h1>CIAAN</h1>
            <h2>Curriculum Implementation and Assessment Norms</h2>
            <p>Academic Year: 2025-2026</p>
            <p>INST. CODE: 0568</p>
          </div>

          <div className="ciann-details-grid" style={{ marginTop: '75px' }}>
            <div className="detail-row">
              <span className="label">Name of Subject Teacher</span>
              <span className="value">{localStorage.getItem("facultyName") || username}</span>
            </div>
            <div className="detail-row">
              <span className="label">Class & Div.</span>
              <span className="value">
                {(() => {
                  const deptCode = ciannData.department?.code || "";
                  const sem = ciannData.semester || "";
                  const scheme = ciannData.scheme || "";
                  const div = ciannData.division || "";
                  if (deptCode || sem || scheme || div) {
                    return `${deptCode}${sem}${scheme}${div}`.toUpperCase();
                  }
                  return "N/A";
                })()}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Subject & Subject Code</span>
              <span className="value">{ciannData.subject.name} ({ciannData.subject.code})</span>
            </div>
            <div className="detail-row">
              <span className="label">Department</span>
              <span className="value">{ciannData.department?.name || "Computer Engineering"}</span>
            </div>
          </div>
          <div className="ciann-detail-actions">
            <button className="btn-back-list" onClick={onBackToList}>← Back</button>
            <button className="btn-forward-detail">→ Forward</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CiannDetailPage;
