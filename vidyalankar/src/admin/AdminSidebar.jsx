import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ isSidebarVisible, setIsSidebarVisible }) => {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);

      // Auto-hide sidebar on mobile when resizing to mobile
      if (mobile && window.innerWidth < 769) {
        setIsSidebarVisible(false);
      }
      // Auto-show sidebar on desktop when resizing to desktop
      else if (!mobile && window.innerWidth >= 769) {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isMobile &&
        isSidebarVisible
      ) {
        setIsSidebarVisible(false);
      }
    };

    if (isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [setIsSidebarVisible, isMobile, isSidebarVisible]);

  // Ensure sidebar visibility is maintained properly
  useEffect(() => {
    const currentVisibility = isSidebarVisible;
    const shouldBeVisible = !isMobile || (isMobile && currentVisibility);

    if (shouldBeVisible !== currentVisibility) {
      setIsSidebarVisible(shouldBeVisible);
    }
  }, [isMobile, isSidebarVisible, setIsSidebarVisible]);

  const handleItemClick = (item) => {
    if (item.available) {
      if (item.path) {
        navigate(item.path, { state: item.state });
        // Close sidebar on mobile after navigation
        if (isMobile) {
          setIsSidebarVisible(false);
        }
      } else {
        alert("This feature is coming soon!");
      }
    } else {
      alert("This feature is coming soon!");
    }
  };

  const sidebarItems = [
    {
      path: "/admin-dashboard",
      icon: "bi-house-door",
      label: "Admin Dashboard",
      available: true,
    },
    {
      path: "/admin-departments",
      icon: "bi-building",
      label: "Manage Departments",
      available: true,
    },
    {
      path: "/admin-faculty",
      icon: "bi-people",
      label: "Manage Faculty",
      available: true,
    },
    {
      path: "/admin-office-staff",
      icon: "bi-person-badge",
      label: "Manage Office Staff",
      available: true,
    },
  ];

  const sidebarClasses = `admin-sidebar ${
    !isSidebarVisible ? "collapsed" : ""
  } ${isMobile ? "mobile" : ""} ${
    isSidebarVisible && isMobile ? "visible" : ""
  }`;

  return (
    <>
      {isMobile && isSidebarVisible && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}
      <div ref={sidebarRef} className={sidebarClasses}>
        {isMobile && (
          <div className="admin-sidebar-header">
            <button
              className="admin-sidebar-close-btn"
              onClick={() => setIsSidebarVisible(false)}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        <ul className="admin-sidebar-menu">
          {sidebarItems.map((item, index) => (
            <li
              key={index}
              className={`admin-sidebar-item ${
                location.pathname === item.path ? "active" : ""
              } ${!item.available ? "coming-soon" : ""}`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={item.available ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && item.available) {
                  handleItemClick(item);
                }
              }}
              aria-label={item.label}
            >
              <i className={`bi ${item.icon} icon`}></i>
              <span>{item.label}</span>
              {!item.available && <span className="badge">Soon</span>}
            </li>
          ))}
        </ul>

        {/* <div className="admin-sidebar-footer">
          <div className="profile">
            <div className="avatar">
              <img
                src="https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff"
                alt="Admin"
              />
            </div>
            <div className="meta">
              <span className="name">Administrator</span>
              <span className="role">Super User</span>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
};

export default AdminSidebar;
