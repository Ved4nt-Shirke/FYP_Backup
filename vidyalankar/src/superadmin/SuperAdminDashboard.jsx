import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import "./SuperAdminDashboard.css";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState([
    {
      id: "institutions",
      label: "Total Institutions",
      value: "--",
      icon: "fas fa-building",
      delta: "Loading...",
      tone: "blue",
    },
    {
      id: "admins",
      label: "Active Admins",
      value: "--",
      icon: "fas fa-user-shield",
      delta: "Loading...",
      tone: "teal",
    },
    {
      id: "uptime",
      label: "System Uptime",
      value: "--",
      icon: "fas fa-signal",
      delta: "Checking...",
      tone: "slate",
    },
  ]);

  const POLL_INTERVAL_MS = 8000;

  const formatUptime = (uptimeSeconds) => {
    if (uptimeSeconds === null || uptimeSeconds === undefined) return "Online";
    const totalMinutes = Math.floor(uptimeSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const formatUpdateTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fetchDashboardStats = async () => {
    try {
      const [institutionsResponse, healthResponse] = await Promise.all([
        axios.get("/superadmin/institutions"),
        axios.get("/health"),
      ]);

      const institutions = institutionsResponse?.data?.institutions ?? [];
      const institutionCount = institutions.length;
      const adminCount = institutions.filter((inst) => inst?.isActive !== false)
        .length;
      const uptimeSeconds = healthResponse?.data?.uptimeSeconds;
      const uptimeValue = formatUptime(uptimeSeconds);
      const healthStatus = healthResponse?.data?.status === "OK";

      setStats([
        {
          id: "institutions",
          label: "Total Institutions",
          value: `${institutionCount}`,
          icon: "fas fa-building",
          delta: institutionCount === 1 ? "1 institution" : "All institutions",
          tone: "blue",
        },
        {
          id: "admins",
          label: "Active Admins",
          value: `${adminCount}`,
          icon: "fas fa-user-shield",
          delta: adminCount === 1 ? "1 active" : "Active admins",
          tone: "teal",
        },
        {
          id: "uptime",
          label: "System Uptime",
          value: uptimeValue,
          icon: "fas fa-signal",
          delta: healthStatus ? "Operational" : "Check failed",
          tone: "slate",
        },
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching superadmin dashboard stats:", error);
      setStats((prevStats) =>
        prevStats.map((stat) => ({
          ...stat,
          delta: "Last check failed",
        })),
      );
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
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

  useEffect(() => {
    fetchDashboardStats();
    const intervalId = setInterval(fetchDashboardStats, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="sa-dashboard">
      <section className="sa-hero">
        <div className="sa-hero__content">
          <p className="sa-kicker">Super Admin</p>
          <h1>Control Center</h1>
          <p className="sa-hero__subtitle">
            Manage institutions, administrators and system operations from one place.
          </p>
          <div className="sa-hero__meta">
            <span className="sa-live">Live updates</span>
            <span className="sa-update-text">
              Updating every 8s
              {lastUpdated ? ` · Updated ${formatUpdateTime(lastUpdated)}` : ""}
            </span>
          </div>
        </div>
        <button className="sa-refresh" onClick={handleRefresh}>
          <i className="fas fa-rotate-right"></i>
          Refresh
        </button>
      </section>

      <section className="sa-stats-grid">
        {stats.map((stat) => (
          <article
            key={stat.id}
            className={`sa-stat-card sa-stat-card--${stat.tone}`}
          >
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

    </div>
  );
};

export default SuperAdminDashboard;
