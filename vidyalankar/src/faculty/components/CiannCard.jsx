import React from "react";
import './EditCiann.css'; // Import the CSS file for styling

const CiaanCard = ({ Ciaan, onClick }) => {
  return (
    <>
      {/* Bootstrap Icons */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div
        className="Ciaan-dashboard-card"
        onClick={() => onClick(Ciaan)}
      >
        <i className="bi bi-pencil-square Ciaan-icon"></i>
        <div className="Ciaan-id">CIAAN ID: {Ciaan.CiaanId}</div>
        <p className="card-text">
          <strong>{Ciaan.subject?.name}</strong>
          <br />
          <span className="subject-code">({Ciaan.subject?.code})</span>
        </p>
        <p className="card-text">
          <span className="division-label">Division:</span> <strong>{Ciaan.division}</strong>
        </p>
      </div>
    </>
  );
};

export default CiaanCard;
