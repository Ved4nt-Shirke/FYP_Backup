import React, { useEffect, useState } from "react";
import Header from "../../basic/Header";
import { config } from "../../config/api";
import { TokenManager } from "../../utils/authUtils.js";
import "../components/EditCiann.css";

const SummaryCards = () => {
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
        setCiannDataList(data);
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
    window.open("/edit-ciann-print", "_blank");
  };

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">Print CIANN</h2>
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading CIAANs...</p>
            </div>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id}
                className="ciann-dashboard-card-link"
                onClick={() => handleCardClick(ciannData)}
                style={{ cursor: "pointer" }}
              >
                <div className="ciann-dashboard-card">
                  <div className="card-content">
                    <i className="bi bi-journal-text ciann-icon"></i>
                    <div className="ciann-id">
                      CIAAN ID: {ciannData.ciannId}
                    </div>
                    <div className="card-text">
                      <strong>{ciannData.subject?.name}</strong>
                      <span className="subject-code">
                        ({ciannData.subject?.code})
                      </span>
                    </div>
                    <div className="card-text">
                      <span className="division-label">Division:</span>{" "}
                      <strong>{ciannData.division}</strong>
                    </div>
                  </div>
                  <div className="card-hover-text">Click to Print CIANN</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">
              No CIAAN data available. Create one to see it here.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default SummaryCards;
