import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { useNavigate } from "react-router-dom";
import { fetchCiannsWithAuth } from "../../utils/ciannFetch";
import "./AttendanceCiannSelector.css";

const AttendanceCiannSelector = ({
  title,
  subtitle,
  navigateTo,
  onSelectState = (ciannData) => ({ ciannData }),
  onSelect,
  iconClass = "bi-book-half",
  continueLabel = "Continue",
}) => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ciannData = await fetchCiannsWithAuth();
        setCiannDataList(ciannData || []);
      } catch (err) {
        alert("Failed to fetch CIANNs: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Header showSearch={false} />
      <div className="ats-page">
        <section className="ats-hero">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </section>

        {loading ? (
          <div className="ats-state">Loading CIANNs...</div>
        ) : ciannDataList.length === 0 ? (
          <div className="ats-state">No CIANNs available.</div>
        ) : (
          <section className="ats-grid">
            {ciannDataList.map((ciannData) => (
              <button
                type="button"
                key={ciannData._id}
                className="ats-card"
                onClick={() => {
                  if (typeof onSelect === "function") {
                    onSelect(ciannData, navigate);
                    return;
                  }
                  navigate(navigateTo, { state: onSelectState(ciannData) });
                }}
              >
                <div className="ats-card-top">
                  <div className="ats-card-icon" aria-hidden="true">
                    <i className={`bi ${iconClass}`}></i>
                  </div>
                  <div className="ats-card-headtext">
                    <h3>{ciannData.subject?.name || "Unknown Subject"}</h3>
                    <p className="ats-code">{ciannData.subject?.code || "-"}</p>
                  </div>
                </div>

                <div className="ats-details">
                  <div className="ats-row">
                    <span className="ats-label">CIANN ID</span>
                    <span className="ats-value">
                      {ciannData.ciannId || "-"}
                    </span>
                  </div>
                  <div className="ats-row">
                    <span className="ats-label">Semester</span>
                    <span className="ats-value">
                      {ciannData.semester || "-"}
                    </span>
                  </div>
                  <div className="ats-row">
                    <span className="ats-label">Division</span>
                    <span className="ats-value">
                      {ciannData.division || "-"}
                    </span>
                  </div>
                  <div className="ats-row">
                    <span className="ats-label">Department</span>
                    <span className="ats-value">
                      {ciannData.department?.name || "Department"}
                    </span>
                  </div>
                </div>

                <div className="ats-card-footer">
                  {continueLabel} <i className="bi bi-arrow-right"></i>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </>
  );
};

export default AttendanceCiannSelector;
