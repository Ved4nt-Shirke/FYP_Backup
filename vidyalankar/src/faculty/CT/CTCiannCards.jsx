import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/api";
import "./CTCiannCards.css";

export default function CTCiannCards() {
  const navigate = useNavigate();
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(config.cianns, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch CIANNs");
        }

        setCiannDataList(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch CIANNs");
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, []);

  const handleCardClick = (ciannData) => {
    navigate(`/ct-dashboard/${ciannData.ciannId}`, { state: { ciannData } });
  };

  return (
    <div className="ct-ciann-page">
      <section className="ct-ciann-hero">
        <h2>
          <i className="bi bi-journal-check me-2"></i>
          CT - Select CIANN
        </h2>
        <p>Choose a CIANN to open the CT marks dashboard.</p>
      </section>

      <section className="ct-ciann-grid-wrap">
        {loading ? (
          <p className="ct-ciann-state">Loading CIANNs...</p>
        ) : error ? (
          <p className="ct-ciann-state ct-ciann-error">{error}</p>
        ) : ciannDataList.length > 0 ? (
          <div className="ct-ciann-grid">
            {ciannDataList.map((ciannData) => (
              <article
                key={ciannData._id || ciannData.ciannId}
                className="ct-ciann-card"
                onClick={() => handleCardClick(ciannData)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCardClick(ciannData);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <div className="ct-ciann-card-id">
                  CIANN ID: {ciannData.ciannId}
                </div>
                <h3>{ciannData.subject?.name || "-"}</h3>
                <p className="ct-ciann-subject-code">
                  {ciannData.subject?.code || "-"}
                </p>
                <p className="ct-ciann-meta">
                  Division: {ciannData.division || "-"}
                </p>
                <span className="ct-ciann-open">Open Dashboard</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="ct-ciann-state">No CIANNs available.</p>
        )}
      </section>
    </div>
  );
}
