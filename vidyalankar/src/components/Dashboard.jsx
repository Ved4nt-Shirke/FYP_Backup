import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../config/api";
import "./Dashboard.css";

const cardsData = [
  { label: "THEORY ATTENDANCE", icon: "bi-calendar-check", path: "/theory-ciann-cards" },
  { label: "PRACTICAL ATTENDANCE", icon: "bi-calendar-check-fill", path: "/practical-ciann-cards" },
  { label: "EXTRA THEORY ATTENDANCE", icon: "bi-calendar-plus", path: "/extra-theory-ciann-cards" },
  { label: "EXTRA PRACTICAL ATTENDANCE", icon: "bi-calendar-plus-fill", path: "/extra-practical-ciann-cards" },
  { label: "TUTORIAL ATTENDANCE", icon: "bi-journals", path: "/tutorial-ciann-cards" },
  { label: "VIEW THEORY ATTENDANCE", icon: "bi-eye", path: "/view-theory-attendance" },
  { label: "VIEW PRACTICAL ATTENDANCE", icon: "bi-eye-fill", path: "/view-practical-attendance" },
  { label: "CREATE CIANN", icon: "bi-file-earmark-plus", path: "/create-ciann" },
  { label: "EDIT CIANN", icon: "bi-pencil-square", path: "/edit-ciann" },
  { label: "PRINT CIANN", icon: "bi-printer-fill", path: "/summary-cards" },
  { label: "VIEW EXTRA THEORY", icon: "bi-eye", message: "View Extra Theory functionality is not yet implemented." }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState("");
  const [ciannProgress, setCiannProgress] = useState({
    loading: true,
    total: 0,
    completed: 0,
    percentage: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchCiannProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!isMounted) return;
          setCiannProgress({
            loading: false,
            total: 0,
            completed: 0,
            percentage: 0,
          });
          return;
        }

        const requestOptions = {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const ciannResponse = await fetch(config.cianns, requestOptions);
        if (!ciannResponse.ok) {
          throw new Error(`Failed to fetch CIANN list (${ciannResponse.status})`);
        }

        const ciannList = await ciannResponse.json();
        const cianns = Array.isArray(ciannList) ? ciannList : [];

        if (cianns.length === 0) {
          if (!isMounted) return;
          setCiannProgress({
            loading: false,
            total: 0,
            completed: 0,
            percentage: 0,
          });
          return;
        }

        const isNonEmptyArrayResponse = async (response) => {
          if (!response.ok) return false;
          const payload = await response.json();
          return Array.isArray(payload) && payload.length > 0;
        };

        const completionChecks = await Promise.all(
          cianns.map(async (ciann) => {
            const ciannId = ciann?.ciannId;
            if (!ciannId) return false;

            const [teachingResult, labResult] = await Promise.allSettled([
              fetch(`${config.teachingPlan}/${ciannId}`, requestOptions),
              fetch(`${config.labPlanning}/${ciannId}`, requestOptions),
            ]);

            let hasTeachingPlan = false;
            let hasLabPlan = false;

            if (teachingResult.status === "fulfilled") {
              hasTeachingPlan = await isNonEmptyArrayResponse(teachingResult.value);
            }

            if (labResult.status === "fulfilled") {
              hasLabPlan = await isNonEmptyArrayResponse(labResult.value);
            }

            return hasTeachingPlan || hasLabPlan;
          }),
        );

        const completed = completionChecks.filter(Boolean).length;
        const total = cianns.length;
        const percentage = Math.round((completed / total) * 100);

        if (!isMounted) return;
        setCiannProgress({
          loading: false,
          total,
          completed,
          percentage,
        });
      } catch (error) {
        console.error("Error fetching Edit CIANN progress:", error);
        if (!isMounted) return;
        setCiannProgress({
          loading: false,
          total: 0,
          completed: 0,
          percentage: 0,
        });
      }
    };

    fetchCiannProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  const progressStatusText = useMemo(() => {
    if (ciannProgress.loading) return "Checking progress...";
    if (ciannProgress.total === 0) return "Create a CIANN to start tracking progress";
    if (ciannProgress.percentage === 100) return "Edit CIANN is fully completed";
    return "Continue Edit CIANN to reach 100%";
  }, [ciannProgress]);

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.message) {
      setAlertMessage(card.message);
    }
  };

  return (
    <div className="scrollable-wrapper faculty-dashboard-shell">
      <div className="dashboard-hero-panel">
        <div className="dashboard-hero-copy">
          <h2>Faculty Dashboard</h2>
          <p>Track CIANN readiness and access all academic workflows from one place.</p>
        </div>

        <div className="dashboard-progress-card">
          <div className="dashboard-progress-head">
            <span>Edit CIANN Progress</span>
            <strong>{ciannProgress.loading ? "--" : `${ciannProgress.percentage}%`}</strong>
          </div>
          <div className="dashboard-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ciannProgress.percentage}>
            <div
              className="dashboard-progress-fill"
              style={{ width: `${ciannProgress.loading ? 0 : ciannProgress.percentage}%` }}
            ></div>
          </div>
          <div className="dashboard-progress-meta">
            <span>
              Completed {ciannProgress.completed} of {ciannProgress.total}
            </span>
            <span>{progressStatusText}</span>
          </div>
        </div>
      </div>

      <div className="card-container">
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
};

export default Dashboard;