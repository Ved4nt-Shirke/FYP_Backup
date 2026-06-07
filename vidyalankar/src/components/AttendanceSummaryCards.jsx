import React, { useEffect, useState } from "react";
import Header from "../basic/Header";
import { config } from "../config/api";
import { TokenManager } from "../utils/authUtils.js";
import "./AttendanceSummaryCards.css";

const AttendanceSummaryCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = TokenManager.getToken();
        if (!token) {
          alert("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        const response = await fetch(config.cianns, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch CIANNs");
        }

        const data = await response.json();
        setCiannDataList(Array.isArray(data) ? data : []);
      } catch (err) {
        alert("Failed to fetch CIANNs: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, []);

  const handleCardClick = (ciannData) => {
    localStorage.setItem("ciannData", JSON.stringify(ciannData));
    localStorage.setItem("summaryReportType", "attendance");
    window.open("/summary-pages", "_blank");
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="attendance-summary-page">
        <div className="attendance-summary-header">
          <h2>Attendance Summary</h2>
          <p>Select a CIANN to generate attendance summary report.</p>
        </div>

        <div className="attendance-summary-grid">
          {loading ? (
            <div className="attendance-summary-loading">
              <div className="attendance-summary-spinner"></div>
              <p>Loading CIANNs...</p>
            </div>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <button
                key={ciannData._id}
                className="attendance-summary-card"
                onClick={() => handleCardClick(ciannData)}
              >
                <div className="attendance-summary-card__icon">
                  <i className="bi bi-clipboard-data"></i>
                </div>
                <div className="attendance-summary-card__body">
                  <h3>{ciannData.subject?.name || "Subject"}</h3>
                  <p>{ciannData.subject?.code || "-"}</p>
                  <p>CIANN ID: {ciannData.ciannId}</p>
                  <p>Division: {ciannData.division || "-"}</p>
                </div>
                <span className="attendance-summary-card__cta">
                  Generate Summary
                </span>
              </button>
            ))
          ) : (
            <p className="attendance-summary-empty">
              No CIANN data available. Create one to generate summary.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AttendanceSummaryCards;
