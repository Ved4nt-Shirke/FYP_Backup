import React, { useState } from "react"; // 1. Import useState
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

// 2. Updated cardsData: 'action' is replaced with 'message' for cards that show an alert.
const cardsData = [
  { label: "THEORY ATTENDANCE", icon: "bi-calendar-check", path: "/theory-ciann-cards" },
  { label: "PRACTICAL ATTENDANCE", icon: "bi-calendar-check-fill", path: "/practical-ciann-cards" },
  { label: "EXTRA THEORY ATTENDANCE", icon: "bi-calendar-plus", path: "/extra-theory-ciann-cards" },
  { label: "EXTRA PRACTICAL ATTENDANCE", icon: "bi-calendar-plus-fill", path: "/extra-practical-ciann-cards" },
  { label: "TUTORIAL ATTENDANCE", icon: "bi-journals", path: "/tutorial-ciann-cards" },
  { label: "PROGRESSIVE ASSESSMENT", icon: "bi-graph-up-arrow", path: "/progressive-assessment" },
  { label: "VIEW THEORY ATTENDANCE", icon: "bi-eye", path: "/view-theory-attendance" },
  { label: "VIEW PRACTICAL ATTENDANCE", icon: "bi-eye-fill", path: "/view-practical-attendance" },
  { label: "CREATE CIANN", icon: "bi-file-earmark-plus", path: "/create-ciann" },
  { label: "EDIT CIANN", icon: "bi-pencil-square", path: "/edit-ciann" },
  { label: "PRINT CIANN", icon: "bi-printer-fill", message: "Print CIANN functionality is not yet implemented." },
  { label: "VIEW EXTRA THEORY", icon: "bi-eye", message: "View Extra Theory functionality is not yet implemented." }
];

const Dashboard = () => {
  const navigate = useNavigate();
  // 3. Add state to manage the alert message. An empty string means the alert is hidden.
  const [alertMessage, setAlertMessage] = useState("");

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.message) {
      // 4. Set the alert message instead of calling an action.
      setAlertMessage(card.message);
    }
  };

  return (
    <div className="scrollable-wrapper">
      <div className="card-container">
        
        {/* 5. Conditionally render the Bootstrap alert */}
        {alertMessage && (
          <div className="alert alert-info alert-dismissible fade show" role="alert" style={{ gridColumn: '1 / -1' }}>
            {alertMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setAlertMessage("")} 
              aria-label="Close"
            ></button>
          </div>
        )}

        {cardsData.map((card) => (
          <div
            // Use a combination of label and a unique property for the key
            key={`${card.label}-${card.path || card.message}`} 
            className="card-item"
            onClick={() => handleCardClick(card)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <i className={`card-icon ${card.icon}`}></i>
            <p className="card-label">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;