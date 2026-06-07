import { useNavigate } from "react-router-dom";
import "./AttendancePanel.css";

const cardsData = [
  {
    label: "View Theory Attendance",
    icon: "bi-calendar-check",
    path: "/view-attend1",
  },
  {
    label: "View Practical Attendance",
    icon: "bi-calendar-check-fill",
    path: "/view-practical1",
  },
  {
    label: "View Extra Theory Attendance",
    icon: "bi-calendar-plus",
    path: "/view-extra-theory-attend",
  },
  {
    label: "View Extra Practical Attendance",
    icon: "bi-calendar-plus-fill",
    path: "/view-extra-practical1",
  },
  {
    label: "View Tutorial Attendance",
    icon: "bi-calendar-plus-fill",
    path: "/view-tutorial-attendance",
  },
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
    <div className="attendance-panel-page">
      <section className="attendance-panel-hero">
        <h2>View Attendance</h2>
        <p>Select an attendance type to continue.</p>
      </section>
      <section className="attendance-panel-grid">
        {cardsData.map((card) => (
          <button
            key={card.label}
            type="button"
            className="attendance-panel-card"
            onClick={() => handleCardClick(card)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <div className="attendance-panel-card-top">
              <span className="attendance-panel-icon">
                <i className={`bi ${card.icon}`}></i>
              </span>
              <h3 className="attendance-panel-title">{card.label}</h3>
            </div>
            <div className="attendance-panel-footer">
              Continue <i className="bi bi-arrow-right"></i>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};
export default ViewAttendance;
