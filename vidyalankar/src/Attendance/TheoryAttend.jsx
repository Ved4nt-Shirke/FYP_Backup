import React, { useEffect, useState } from "react";
import Header from "../basic/Header";
import { useNavigate } from "react-router-dom";
import { fetchCiannsWithAuth } from "../utils/ciannFetch";
import "../components/EditCiann.css";

const TheoryCiannCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ciannData = await fetchCiannsWithAuth();
        setCiannDataList(ciannData);
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
      {/* Added for Bootstrap Icons */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            Theory Attendance - Select CIAAN
          </h2>
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <p>Loading...</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              // Applying the same structure and classes as EditCiann.jsx
              <div
                key={ciannData._id}
                className="ciann-dashboard-card"
                onClick={() =>
                  navigate("/theory-edit", { state: { ciannData } })
                }
              >
                <i className="bi bi-pencil-square ciann-icon"></i>
                <div className="ciann-id">CIAAN ID: {ciannData.ciannId}</div>
                <p className="card-text">
                  <strong>{ciannData.subject?.name}</strong>
                  <br />({ciannData.subject?.code})
                </p>
                <p className="card-text">
                  Division: <strong>{ciannData.division}</strong>
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
};

export default TheoryCiannCards;
