import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OfficeHeader.css";

const OfficeHeader = ({ onMenuToggle, staffName = "Office Staff" }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="office-header-container">
      <div className="office-header-content">
        <div className="office-header-left">
          <button className="menu-toggle" onClick={onMenuToggle} title="Toggle Sidebar">
            ☰
          </button>
          <div className="office-logo">
            <div className="logo-icon">📋</div>
            <span className="logo-text">Office Portal</span>
          </div>
        </div>

        <div className="office-header-right">
          <div className="user-menu-wrapper">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={staffName}
            >
              <div className="user-avatar">
                {staffName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{staffName}</span>
              <span className="dropdown-icon">▼</span>
            </button>

            {showUserMenu && (
              <>
                <div className="dropdown-backdrop" onClick={() => setShowUserMenu(false)} />
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <div className="user-avatar-large">{staffName.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="user-menu-name">{staffName}</p>
                      <p className="user-menu-role">Office Staff</p>
                    </div>
                  </div>
                  <div className="user-menu-divider"></div>
                  <button className="user-menu-item" onClick={() => window.location.reload()}>
                    <span>🔄</span> Refresh
                  </button>
                  <button className="user-menu-item logout" onClick={handleLogout}>
                    <span>🚪</span> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default OfficeHeader;
