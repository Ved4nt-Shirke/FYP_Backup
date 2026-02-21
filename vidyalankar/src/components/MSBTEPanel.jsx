import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MSBTEPanel.css";

const MSBTEPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const menuItems = [
    // FA-PR-K3
    {
      id: "fa-pr-k3-generate",
      label: "FA-PR-K3: Generate",
      icon: "bi-plus-circle",
      route: "/msbte/fa-pr-k3/generate",
    },
    // SA-PR-K4
    {
      id: "sa-pr-k4-generate",
      label: "SA-PR-K4: Generate",
      icon: "bi-plus-circle",
      route: "/msbte/sa-pr-k4/generate",
    },
    {
      id: "sa-pr-k4-edit",
      label: "SA-PR-K4: Edit",
      icon: "bi-pencil-square",
      route: "/msbte/sa-pr-k4/edit",
    },
    {
      id: "sa-pr-k4-print",
      label: "SA-PR-K4: Print",
      icon: "bi-printer-fill",
      route: "/msbte/sa-pr-k4/print",
    },
    // FA-TH-K5
    {
      id: "fa-th-k5",
      label: "FA-TH-K5",
      icon: "bi-folder-fill",
      route: null,
    },
    // SLA-K6
    {
      id: "sla-k6",
      label: "SLA-K6",
      icon: "bi-folder-fill",
      route: null,
    },
    // Attendance Report
    {
      id: "attendance",
      label: "Attendance Report",
      icon: "bi-calendar-check",
      route: "/msbte/attendance",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      const msbteItem = document.querySelector(".msbte-sidebar-item");
      if (msbteItem) {
        const rect = msbteItem.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 5,
          left: rect.left,
        });
      }

      // Close dropdown on outside click
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          const msbteItem = document.querySelector(".msbte-sidebar-item");
          if (!msbteItem || !msbteItem.contains(e.target)) {
            onClose();
          }
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleItemClick = (route) => {
    if (route) {
      navigate(route);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="msbte-dropdown-wrapper"
      ref={dropdownRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="msbte-dropdown-container">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`msbte-dropdown-option ${item.route ? "" : "disabled"}`}
            onClick={() => handleItemClick(item.route)}
            disabled={!item.route}
          >
            <i className={`bi ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MSBTEPanel;
