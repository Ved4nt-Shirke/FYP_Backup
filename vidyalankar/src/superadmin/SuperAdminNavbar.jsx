import React from "react";
import "./SuperAdminNavbar.css";

const SuperAdminNavbar = () => {
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <div className="superadmin-navbar">
      <div className="navbar-left">
        <h2>Super Admin Panel</h2>
      </div>
      <div className="navbar-right">
        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default SuperAdminNavbar;
