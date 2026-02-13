import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../basic/Header";
import { config } from "../config/api";
import { TokenManager } from "../utils/authUtils.js";
import "./EditCiann.css";

const EditCiann = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCiannData, setSelectedCiannData] = useState(null);

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
          <h2 className="text-center py-2 bg-success text-white">Edit CIAAN</h2>
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading CIAANs...</p>
            </div>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <Link
                key={ciannData._id}
                to="/course-diary"
                state={{ ciannData: ciannData }}
                className="ciann-dashboard-card-link"
                onClick={() => {
                  console.log("Selected CIAAN:", ciannData);
                  setSelectedCiannData(ciannData);
                  // Store CIAAN data in both sessionStorage and localStorage
                  sessionStorage.setItem(
                    "currentCiannData",
                    JSON.stringify(ciannData)
                  );
                  localStorage.setItem("ciannData", JSON.stringify(ciannData));
                }}
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
                  <div className="card-hover-text">Click to Edit</div>
                </div>
              </Link>
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

export default EditCiann;
