import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../basic/Header";
import { fetchCiannsWithAuth } from "../utils/ciannFetch";
import "../components/EditCiann.css";

export default function CTCiannCards() {
  const [cianns, setCianns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCianns = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchCiannsWithAuth();
        setCianns(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load CIANNs");
      } finally {
        setLoading(false);
      }
    };

    loadCianns();
  }, []);

  return (
    <>
      <Header showSearch={false} />
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            Class Test - Select CIANN
          </h2>
        </div>

        {loading && <p className="text-center mt-3">Loading CIANNs...</p>}
        {error && <p className="text-center text-danger mt-3">{error}</p>}

        {!loading && !error && (
          <div className="ciann-card-container">
            {cianns.length === 0 ? (
              <p className="text-center">No CIANNs available.</p>
            ) : (
              cianns.map((ciann) => (
                <div
                  key={ciann._id}
                  className="ciann-dashboard-card"
                  onClick={() =>
                    navigate(`/ct-dashboard/${ciann.ciannId}`, {
                      state: { ciannData: ciann },
                    })
                  }
                >
                  <i className="bi bi-journal-check ciann-icon"></i>
                  <div className="ciann-id">CIANN ID: {ciann.ciannId}</div>
                  <p className="card-text">
                    <strong>{ciann.subject?.name || "Subject"}</strong>
                    <br />({ciann.subject?.code || "-"})
                  </p>
                  <p className="card-text">
                    Division: <strong>{ciann.division || "-"}</strong>
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
