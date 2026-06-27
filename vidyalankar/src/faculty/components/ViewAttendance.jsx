import { useNavigate } from "react-router-dom";
import "./AttendancePanel.css";

const cardsData = [
  {
    label: "View Theory Attendance",
    badge: "Theory",
    description: "Browse and inspect attendance history for regular theory lectures.",
    icon: "bi-journal-bookmark-fill",
    path: "/view-attend1",
    color: "blue",
  },
  {
    label: "View Practical Attendance",
    badge: "Practical",
    description: "Browse and inspect batch-wise attendance logs for practical experiments.",
    icon: "bi-cpu-fill",
    path: "/view-practical1",
    color: "emerald",
  },
  {
    label: "View Extra Theory Attendance",
    badge: "Extra",
    description: "Inspect student attendance reports for extra theory sessions.",
    icon: "bi-calendar-plus-fill",
    path: "/view-extra-theory-attend",
    color: "indigo",
  },
  {
    label: "View Extra Practical Attendance",
    badge: "Extra Lab",
    description: "Inspect student attendance reports for extra practical labs.",
    icon: "bi-folder-plus",
    path: "/view-extra-practical1",
    color: "pink",
  },
  {
    label: "View Tutorial Attendance",
    badge: "Tutorial",
    description: "Inspect recorded attendance data for tutorials and group sessions.",
    icon: "bi-chat-left-text-fill",
    path: "/view-tutorial-attendance",
    color: "amber",
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
            className={`attendance-panel-card theme-${card.color}`}
            onClick={() => handleCardClick(card)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && handleCardClick(card)
            }
          >
            <div className="attendance-panel-card-body">
              <div className="attendance-panel-card-header">
                <span className="attendance-panel-badge">{card.badge}</span>
                <span className="attendance-panel-icon">
                  <i className={`bi ${card.icon}`}></i>
                </span>
              </div>
              <h3 className="attendance-panel-title">{card.label}</h3>
              <p className="attendance-panel-desc">{card.description}</p>
            </div>
            <div className="attendance-panel-action">
              <span>Continue</span>
              <i className="bi bi-arrow-right-short"></i>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};

export default ViewAttendance;
