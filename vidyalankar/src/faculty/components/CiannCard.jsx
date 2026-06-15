import React from "react";
import './EditCiann.css'; // Import the CSS file for styling

const CiannCard = ({ ciann, onClick }) => {
  return (
    <>
      {/* Bootstrap Icons */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div 
        className="ciann-dashboard-card" 
        onClick={() => onClick(ciann)}
      >
        <i className="bi bi-pencil-square ciann-icon"></i>
        <div className="ciann-id">CIAAN ID: {ciann.ciannId}</div>
        <p className="card-text">
          <strong>{ciann.subject?.name}</strong>
          <br />
          <span className="subject-code">({ciann.subject?.code})</span>
        </p>
        <p className="card-text">
          <span className="division-label">Division:</span> <strong>{ciann.division}</strong>
        </p>
      </div>
    </>
  );
};

export default CiannCard;
