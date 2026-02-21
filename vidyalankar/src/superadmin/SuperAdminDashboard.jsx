import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import "./SuperAdminDashboard.css";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [statsData, setStatsData] = useState({
    institutions: 0,
    admins: 0,
    uptime: "99.9%",
  });

  const fetchDashboardStats = async () => {
    try {
      setLoadingCounts(true);

      const [institutionsRes, adminsRes] = await Promise.all([
        axios.get("/superadmin/institutions"),
        axios.get("/superadmin/admins"),
      ]);

      const institutions = institutionsRes?.data?.institutions || [];
      const admins = adminsRes?.data?.admins || [];

      setStatsData({
        institutions: institutions.length,
        admins: admins.filter((admin) => admin?.isActive !== false).length,
        uptime: "99.9%",
      });
    } catch (error) {
      console.error("Failed to fetch superadmin dashboard stats:", error);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const dashboardCards = [
    {
      id: 1,
      title: "Create Institution",
      description:
        "Add a new institution to the system with admin credentials.",
      icon: "fas fa-university",
      action: () => navigate("/superadmin-create-institution"),
      badge: "New",
      stats: "0 pending",
    },
    {
      id: 2,
      title: "View Institutions",
      description: "See all institutions and their admin credentials.",
      icon: "fas fa-th-large",
      action: () => navigate("/superadmin-view-institutions"),
      badge: "Active",
      stats: `${statsData.institutions} institutions`,
    },
    {
      id: 3,
      title: "Manage Admins",
      description: "Control admin access and assign institution permissions.",
      icon: "fas fa-user-tie",
      action: () => navigate("/superadmin-admins"),
      badge: "Manage",
      stats: `${statsData.admins} active`,
    },
  ];

  const stats = [
    {
      label: "Total Institutions",
      value: String(statsData.institutions),
      icon: "fas fa-building",
    },
    {
      label: "Active Admins",
      value: String(statsData.admins),
      icon: "fas fa-users",
    },
    {
      label: "System Uptime",
      value: statsData.uptime,
      icon: "fas fa-heartbeat",
    },
  ];

  return (
    <div className="sa-dashboard">
      <div className="sa-dashboard-header">
        <div className="sa-header-content">
          <div className="sa-header-text">
            <h1 className="sa-main-title">Super Admin Control Center</h1>
            <p className="sa-header-subtitle">
              Manage all institutions and administrative operations
            </p>
          </div>
        </div>
        <button
          className="sa-btn-refresh"
          onClick={fetchDashboardStats}
          disabled={loadingCounts}
        >
          <i className="fas fa-sync-alt"></i>
          <span>{loadingCounts ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="sa-stats-section">
        {stats.map((stat, idx) => (
          <div key={idx} className="sa-stat-card">
            <div className="sa-stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="sa-stat-content">
              <div className="sa-stat-value">{stat.value}</div>
              <div className="sa-stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sa-cards-container">
        <h2 className="sa-section-title">Core Management</h2>
        <div className="sa-card-grid">
          {dashboardCards.map((card) => (
            <div
              key={card.id}
              className={`sa-enhanced-card ${
                activeCard === card.id ? "active" : ""
              }`}
              onMouseEnter={() => setActiveCard(card.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="sa-card-content">
                <div className="sa-card-badge">{card.badge}</div>

                <div className="sa-card-icon-container">
                  <i className={card.icon}></i>
                </div>

                <h3 className="sa-card-title">{card.title}</h3>
                <p className="sa-card-description">{card.description}</p>

                <div className="sa-card-stats">{card.stats}</div>

                <button className="sa-btn-card" onClick={card.action}>
                  <span>Access Now</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
