import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";
import "../components/EditCiann.css";
import { config } from "../config/api";

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
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            CT - Select CIANN
          </h2>
        </div>

        <div className="ciann-card-container">
          {loading ? (
            <p>Loading CIANNs...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id || ciannData.ciannId}
                className="ciann-dashboard-card"
                onClick={() => handleCardClick(ciannData)}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-pencil-square ciann-icon"></i>
                <div className="ciann-id">CIAAN ID: {ciannData.ciannId}</div>
                <p className="card-text">
                  <strong>{ciannData.subject?.name || "-"}</strong>
                  <br />
                  <span className="subject-code">
                    ({ciannData.subject?.code || "-"})
                  </span>
                </p>
                <p className="card-text">
                  Division: <strong>{ciannData.division || "-"}</strong>
                </p>
              </div>
            ))
          ) : (
            <p className="text-center">No CIAANs available.</p>
          )}
        </div>
      </div>
    </>
  );
}
