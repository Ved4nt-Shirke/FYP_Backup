import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { config } from "../../config/api";
import "../../components/EditCiann.css";
import "./K3Pages.css";

const modeToPath = {
  generate: "/msbte/sa-pr-k4/generate",
  edit: "/msbte/sa-pr-k4/edit",
  print: "/msbte/sa-pr-k4/print",
};

const SAPRK4CiannCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = (searchParams.get("mode") || "generate").toLowerCase();
  const targetPath = modeToPath[mode] || modeToPath.generate;

  const ownerUsername = useMemo(() => {
    return (localStorage.getItem("username") || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    const fetchCianns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(config.cianns, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch CIANN entries");
        }

        const list = Array.isArray(data) ? data : [];
        const filtered = ownerUsername
          ? list.filter(
              (ciann) =>
                String(ciann?.ownerUsername || "").trim().toLowerCase() ===
                ownerUsername,
            )
          : list;

        setCiannDataList(filtered);
      } catch (err) {
        console.error("Error fetching CIANN entries:", err);
        setError("Failed to load CIANN entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchCianns();
  }, [ownerUsername]);

  const handleCardClick = (ciannData) => {
    navigate(targetPath, { state: { ciannData } });
  };

  return (
    <div className="k3-page">
      <div className="k3-page-header">
        <h2>MSBTE Formats (K Scheme)</h2>
        <p>SA-PR-K4 - Select CIANN ({mode})</p>
      </div>

      <div className="ciann-card-container">
        {loading ? (
          <p>Loading CIANN entries...</p>
        ) : error ? (
          <p className="k3-error">{error}</p>
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
  );
};

export default SAPRK4CiannCards;
