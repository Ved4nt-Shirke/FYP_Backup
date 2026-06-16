import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../basic/Header";
import { config } from "../config/api";
import "../faculty/components/EditCiann.css";
import "./k5.css";

const K5CiannCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ownerUsername = useMemo(
    () => (localStorage.getItem("username") || "").trim().toLowerCase(),
    [],
  );

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        setLoading(true);
        const response = await axios.get(config.cianns);
        const data = Array.isArray(response.data) ? response.data : [];
        const filtered = ownerUsername
          ? data.filter(
              (ciann) =>
                String(ciann?.ownerUsername || "").trim().toLowerCase() ===
                ownerUsername,
            )
          : data;
        setCiannDataList(filtered);
      } catch (err) {
        console.error("Error fetching CIANNs:", err);
        setError("Failed to load CIANN entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, [ownerUsername]);

  const handleCardClick = (ciannData) => {
    navigate("/msbte/k5/print", { state: { ciannData } });
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="k5-page">
        <div className="k5-page-header">
          <h2>MSBTE Formats (K Scheme)</h2>
          <p>FA-TH-K5 - Select CIANN</p>
        </div>

        <div className="ciann-card-container">
          {loading ? (
            <p>Loading CIANN entries...</p>
          ) : error ? (
            <p className="k5-error">{error}</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id}
                className="ciann-dashboard-card"
                onClick={() => handleCardClick(ciannData)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleCardClick(ciannData);
                  }
                }}
              >
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
            <p className="text-center">No CIANN entries found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default K5CiannCards;
