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

  const adminUsername = localStorage.getItem("username") || "Admin";
  const adminInstitution = localStorage.getItem("college") || "Institution";

  const sidebarItems = [
    {
      path: "/admin-dashboard",
      icon: "bi-house-fill",
      label: "Admin Dashboard",
      available: true,
    },
    {
      path: "/admin/vision-mission",
      icon: "bi-info-circle-fill",
      label: "Vision, Mission & PEO",
      available: true,
    },
    {
      path: "/admin/rooms",
      icon: "bi-door-closed-fill",
      label: "Manage Rooms & Labs",
      available: true,
    },
    {
      path: "/admin/promotions",
      icon: "bi-arrow-up-right-circle-fill",
      label: "Promotions & Archive",
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
      icon: "bi-people-fill",
      label: "Manage Faculty",
      available: true,
    },
    {
      path: "/admin-hod",
      icon: "bi-people-fill",
      label: "Manage HODs",
      available: true,
    },
    {
      path: "/admin-academic-coordinator",
      icon: "bi-people-fill",
      label: "Manage Coordinators",
      available: true,
    },
    {
      path: "/admin-office-staff",
      icon: "bi-person-vcard-fill",
      label: "Manage Office Staff",
      available: true,
    },
    {
      path: "/admin/subjects",
      icon: "bi-plus-circle-fill",
      label: "Add Subjects",
      available: true,
    },
    {
      path: "/admin/subjects-view",
      icon: "bi-list-check",
      label: "View Subjects",
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

        <div className="admin-sidebar-top">
          <div className="admin-info">
            <div className="admin-icon">
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="admin-details">
              <p className="admin-label">Administrator</p>
              <p className="admin-college">{adminInstitution}</p>
            </div>
          </div>
        </div>

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
      </div>
    </>
  );
};

export default AdminSidebar;
