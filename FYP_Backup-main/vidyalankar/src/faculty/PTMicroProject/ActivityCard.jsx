import React from "react";
import "./ActivityCard.css";

const ActivityCard = ({ title, icon, isSelected, onClick }) => {
  return (
    <div
      className={`activity-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="activity-card-inner">
        <span className="activity-card-badge">
          {isSelected ? "Selected" : "Choose"}
        </span>
        <i className={`bi ${icon} activity-card-icon`}></i>
        <h5 className="activity-card-title">{title}</h5>
        <p className="activity-card-label">Click to select</p>
      </div>
    </div>
  );
};

export default ActivityCard;
