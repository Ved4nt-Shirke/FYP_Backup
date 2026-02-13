import React from "react";
import { useNavigate } from "react-router-dom";
import "./SuperAdminDashboard.css"; // Ensure CSS is imported

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Create Institution",
      description:
        "Add a new institution to the system with admin credentials.",
      icon: "fas fa-university",
      action: () => navigate("/superadmin-create-institution"),
      color: "primary", // Maps to Green
      btnClass: "btn-primary",
    },
    {
      title: "View Institutions",
      description: "See all institutions and their admin credentials.",
      icon: "fas fa-list",
      action: () => navigate("/superadmin-view-institutions"),
      color: "secondary", // Maps to Light Green
      btnClass: "btn-secondary",
    },
    {
      title: "System Stats",
      description: "View system-wide statistics and metrics.",
      icon: "fas fa-chart-bar",
      action: () => {},
      color: "info", // Maps to Teal/Green
      disabled: true,
      btnClass: "btn-disabled",
    },
  ];

  return (
    <div className="superadmin-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Super Admin Dashboard</h2>
          <p>Manage all institutions in the system</p>
        </div>
        <div>
          <button className="btn btn-outline-primary">
            <i className="fas fa-sync-alt me-2"></i>Refresh
          </button>
        </div>
      </div>

      <div className="card-grid">
        {dashboardCards.map((card, index) => (
          <div className="dashboard-card" key={index}>
            <div className="card-body">
              <div className={`card-icon-wrapper bg-${card.color}`}>
                <i className={`${card.icon}`}></i>
              </div>
              <h5 className="card-title">{card.title}</h5>
              <p className="card-description">{card.description}</p>
              <button
                className={`btn ${card.btnClass}`}
                onClick={card.action}
                disabled={card.disabled}
              >
                {card.disabled ? "Coming Soon" : `Go to ${card.title}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="activity-card">
            <div className="activity-header">Recent Activity</div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon-small">
                  <i className="fas fa-plus"></i>
                </div>
                <div className="flex-grow-1 activity-content">
                  <h6>New Institution Created</h6>
                  <p className="text-muted mb-0 small">
                    Vidyalankar Polytechnic was created
                  </p>
                </div>
                <span className="activity-time">2h ago</span>
              </div>
              <div className="activity-item">
                <div className="activity-icon-small">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="flex-grow-1 activity-content">
                  <h6>Admin User Added</h6>
                  <p className="text-muted mb-0 small">
                    New admin user for VIT created
                  </p>
                </div>
                <span className="activity-time">1d ago</span>
              </div>
              <div className="activity-item">
                <div className="activity-icon-small">
                  <i className="fas fa-cog"></i>
                </div>
                <div className="flex-grow-1 activity-content">
                  <h6>System Update</h6>
                  <p className="text-muted mb-0 small">
                    System updated to version 2.1.0
                  </p>
                </div>
                <span className="activity-time">3d ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
