import React from "react";
import { useNavigate } from "react-router-dom";
import "./SuperAdminDashboard.css";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const managementCards = [
    {
      id: "create",
      title: "Create Institution",
      description: "Add a new institution to the system with admin credentials.",
      icon: "fas fa-university",
      action: () => navigate("/superadmin-create-institution"),
      badge: "Quick Setup",
      stats: "Create and configure in one flow",
    },
    {
      id: "view",
      title: "View Institutions",
      description: "See all institutions and their admin credentials.",
      icon: "fas fa-th-large",
      action: () => navigate("/superadmin-view-institutions"),
      badge: "Directory",
      stats: "Track institution health and status",
    },
  ];

  const stats = [
    {
      label: "Total Institutions",
      value: "3",
      icon: "fas fa-building",
      delta: "+1 this month",
    },
    {
      label: "Active Admins",
      value: "5",
      icon: "fas fa-users",
      delta: "All systems active",
    },
    {
      label: "System Uptime",
      value: "99.9%",
      icon: "fas fa-heartbeat",
      delta: "Operational",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      title: "New institution created",
      description: "Vidyalankar Polytechnic was added and activated.",
      time: "2 hours ago",
      icon: "fas fa-plus-circle",
    },
    {
      id: 2,
      title: "Admin account provisioned",
      description: "New admin access granted for VIT.",
      time: "1 day ago",
      icon: "fas fa-user-plus",
    },
    {
      id: 3,
      title: "Platform maintenance complete",
      description: "Background maintenance completed successfully.",
      time: "3 days ago",
      icon: "fas fa-screwdriver-wrench",
    },
  ];

  return (
    <div className="sa-dashboard">
      <section className="sa-hero">
        <div className="sa-hero__content">
          <p className="sa-kicker">Super Admin</p>
          <h1>Control Center</h1>
          <p className="sa-hero__subtitle">
            Manage institutions, administrators and system operations from one place.
          </p>
        </div>
        <button className="sa-refresh" onClick={handleRefresh}>
          <i className="fas fa-rotate-right"></i>
          Refresh
        </button>
      </section>

      <section className="sa-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="sa-stat-card">
            <div className="sa-stat-card__icon">
              <i className={stat.icon}></i>
            </div>
            <div className="sa-stat-card__content">
              <p className="sa-stat-card__label">{stat.label}</p>
              <h3>{stat.value}</h3>
              <span>{stat.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="sa-section">
        <div className="sa-section__header">
          <h2>Core Management</h2>
        </div>
        <div className="sa-management-grid">
          {managementCards.map((card) => (
            <article key={card.id} className="sa-management-card">
              <div className="sa-management-card__top">
                <div className="sa-management-card__icon">
                  <i className={card.icon}></i>
                </div>
                <span className="sa-badge">{card.badge}</span>
              </div>

              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className="sa-management-card__meta">{card.stats}</div>

              <button className="sa-action-btn" onClick={card.action}>
                Open Section
                <i className="fas fa-arrow-right"></i>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="sa-section">
        <div className="sa-section__header">
          <h2>System Activity</h2>
        </div>
        <div className="sa-activity-grid">
          {recentActivity.map((activity) => (
            <article key={activity.id} className="sa-activity-card">
              <div className="sa-activity-card__icon">
                <i className={activity.icon}></i>
              </div>
              <div>
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                <span>{activity.time}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
