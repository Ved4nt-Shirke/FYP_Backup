import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildInstitutionLogoUrl,
  getInstitutionInitials,
} from "../utils/institutionBranding";
import config from "../config/api";
import "./AdminHeader.css";

const AdminHeader = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [activeYear, setActiveYear] = useState(null);

  // Get admin info from localStorage
  const adminInstitution = (localStorage.getItem("college") || "VP").toUpperCase();
  const institutionCode = (
    localStorage.getItem("institutionCode") || adminInstitution
  ).toUpperCase();
  const institutionName =
    localStorage.getItem("institutionName") || institutionCode;
  const institutionLogoUrl = buildInstitutionLogoUrl(
    localStorage.getItem("institutionLogoUrl") || "",
  );
  const institutionFallback = getInstitutionInitials(
    institutionName,
    institutionCode,
  );
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => {
    const fetchActiveYear = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(config.academicYear.current, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.academicYear) {
          setActiveYear(data.academicYear);
        }
      } catch (err) {
        console.error("Error fetching active academic year:", err);
      }
    };
    fetchActiveYear();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <header className="admin-page-header">
      <div className="header-left">
        {/* Mobile menu toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="admin-page-titles">
          <h1 className="admin-page-title">
            <span className="institution-brand">
              {institutionLogoUrl ? (
                <img
                  src={institutionLogoUrl}
                  alt={institutionName}
                  className="institution-brand-logo"
                />
              ) : (
                <span className="institution-brand-fallback">{institutionFallback}</span>
              )}
              {institutionCode} Admin Panel
              {activeYear && (
                <span className="active-ay-badge" style={{
                  marginLeft: '12px',
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="bi bi-calendar3" style={{ fontSize: '0.7rem' }}></i>
                  AY: {activeYear.yearName} ({activeYear.scheme})
                </span>
              )}
            </span>
          </h1>
          <p className="admin-page-subtitle">{institutionName}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="admin-user-info">
          <div className="user-avatar">
            <span>{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-details">
            <span className="user-name">{username}</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>

        <button className="btn-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
