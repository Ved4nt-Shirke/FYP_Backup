import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const cardsData = [
  { label: "VIEW THEORY ATTENDANCE", icon: "bi-calendar-check", path: "/view-attend1" },
  { label: "VIEW PRACTICAL ATTENDANCE", icon: "bi-calendar-check-fill", path: "/view-practical1" },
  { label: "VIEW EXTRA THEORY ATTENDANCE", icon: "bi-calendar-plus", path: "/view-extra-theory-attend" },
  { label: "VIEW EXTRA PRACTICAL ATTENDANCE", icon: "bi-calendar-plus-fill", path: "/view-extra-practical1" },
  { label: "VIEW TUTORIAL ATTENDANCE", icon: "bi-calendar-plus-fill", path: "/view-tutorial-attendance" }
  
];

const ViewAttendance = () => {
  const navigate = useNavigate();

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.action) {
      card.action();
    }
  };

  return (
    <div className="scrollable-wrapper">
      <div className="card-container">
        {cardsData.map((card) => (
          <div
            key={card.label}
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
export default ViewAttendance;
