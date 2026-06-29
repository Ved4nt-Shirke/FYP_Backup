import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./SuperAdminNavbar.css";

const SuperAdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: "/superadmin-dashboard", label: "Dashboard", icon: "fas fa-gauge-high" },
    {
      to: "/superadmin-create-institution",
      label: "Create Institution",
      icon: "fas fa-plus-circle",
    },
    {
      to: "/superadmin-view-institutions",
      label: "View Institutions",
      icon: "fas fa-building",
    },
  ];

  const isActiveRoute = (to) => {
    if (to === "/superadmin-view-institutions") {
      return (
        location.pathname === to ||
        location.pathname.startsWith("/superadmin-manage-institution/")
      );
    }
    return location.pathname === to;
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <header className="superadmin-navbar">
      <div className="superadmin-navbar-top">
        <div className="navbar-left">
          <button
            className="brand-button"
            type="button"
            onClick={() => navigate("/superadmin-dashboard")}
          >
            <img src="/new.png" className="superadmin-brand-logo" alt="VPCIAAN Logo" />
            <div className="brand-texts">
              <h2>Super Admin</h2>
              <span>Control Panel</span>
            </div>
          </button>
        </div>
        <div className="navbar-right">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      <div className="superadmin-tabs" role="tablist" aria-label="Super admin sections">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`superadmin-tab ${isActiveRoute(item.to) ? "active" : ""}`}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </header>
  );
};

export default SuperAdminNavbar;
