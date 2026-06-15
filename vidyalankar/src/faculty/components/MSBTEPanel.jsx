import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MSBTEPanel.css";

const MSBTEPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [openSections, setOpenSections] = useState({ k3: true, k4: true });

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
    navigate(route);
    onClose();
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
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
        <button
          className="msbte-dropdown-option"
          onClick={() => toggleSection("k3")}
        >
          <i className="bi bi-file-earmark"></i>
          <span>FA-PR-K3</span>
          <i
            className={`bi ms-auto ${openSections.k3 ? "bi-chevron-down" : "bi-chevron-left"}`}
          ></i>
        </button>
        {openSections.k3 && (
          <button
            className="msbte-dropdown-option"
            onClick={() => handleItemClick("/msbte/fa-pr-k3/cianns")}
          >
            <i className="bi bi-dot"></i>
            <span>Generate</span>
          </button>
        )}

        <button
          className="msbte-dropdown-option"
          onClick={() => toggleSection("k4")}
        >
          <i className="bi bi-file-earmark"></i>
          <span>SA-PR-K4</span>
          <i
            className={`bi ms-auto ${openSections.k4 ? "bi-chevron-down" : "bi-chevron-left"}`}
          ></i>
        </button>
        {openSections.k4 && (
          <>
            <button
              className="msbte-dropdown-option"
              onClick={() =>
                handleItemClick("/msbte/sa-pr-k4/cianns?mode=generate")
              }
            >
              <i className="bi bi-dot"></i>
              <span>Generate</span>
            </button>
            <button
              className="msbte-dropdown-option"
              onClick={() => handleItemClick("/msbte/sa-pr-k4/cianns?mode=edit")}
            >
              <i className="bi bi-dot"></i>
              <span>Edit</span>
            </button>
            <button
              className="msbte-dropdown-option"
              onClick={() =>
                handleItemClick("/msbte/sa-pr-k4/cianns?mode=print")
              }
            >
              <i className="bi bi-dot"></i>
              <span>Print</span>
            </button>
          </>
        )}

        <button
          className="msbte-dropdown-option"
          onClick={() => handleItemClick("/msbte/fa-th-k5/cianns")}
        >
          <i className="bi bi-file-earmark"></i>
          <span>FA-TH-K5</span>
        </button>

        <button
          className="msbte-dropdown-option"
          onClick={() => handleItemClick("/msbte/industrial-visit/k8")}
        >
          <i className="bi bi-building"></i>
          <span>Industrial Visit K8</span>
        </button>

        <button
          className="msbte-dropdown-option"
          onClick={() => handleItemClick("/msbte/expert-lecture/k9")}
        >
          <i className="bi bi-person-video3"></i>
          <span>Expert Lecture K9</span>
        </button>

      </div>
    </div>
  );
};

export default MSBTEPanel;
