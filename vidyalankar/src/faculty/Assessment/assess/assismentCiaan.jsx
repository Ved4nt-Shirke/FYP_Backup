// src/Attendance/AssismentCiaanCards.jsx
import React, { useEffect, useState } from "react";
import Header from "../../../basic/Header";
import { useNavigate } from "react-router-dom"; // 👈 import navigate
import "../../components/EditCiann.css";

const AssismentCiaanCards = () => {
  const [ciannDataList, setCiannDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExperiments, setLoadingExperiments] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const navigate = useNavigate(); // 👈 useNavigate hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CIANNs
        const ciannRes = await fetch("http://localhost:5000/api/cianns");
        const ciannData = await ciannRes.json();
        setCiannDataList(ciannData);

        // Fetch available batches for assessment
        const batchesRes = await fetch("http://localhost:5000/api/assessments/batches");
        const batchesData = await batchesRes.json();
        if (batchesData.success) {
          setAvailableBatches(batchesData.batches);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Failed to fetch CIANNs and batch information");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCardClick = async (ciannData) => {
    setLoadingExperiments(true);
    try {
      // Fetch experiments for this CIAAN's subject
      const experimentsRes = await fetch("http://localhost:5000/api/assessments/get-experiments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          program: ciannData.department?.name || "",
          className: ciannData.class || "",
          course: ciannData.subject?.name || "",
        }),
      });
      
      const experimentsData = await experimentsRes.json();
      
      if (experimentsData.success) {
        // Pass CIAAN data, experiments, and available batches to the next page
        navigate("/assess-batch-select", { 
          state: { 
            ciannData,
            experiments: experimentsData.experiments || [],
            availableBatches: availableBatches
          } 
        });
      } else {
        // If no experiments found, still navigate but with empty experiments array
        navigate("/assess-batch-select", { 
          state: { 
            ciannData,
            experiments: [],
            availableBatches: availableBatches
          } 
        });
      }
    } catch (error) {
      console.error("Error fetching experiments:", error);
      alert("Failed to fetch experiments. Proceeding with empty experiments list.");
      // Navigate anyway with empty experiments array
      navigate("/assess-batch-select", { 
        state: { 
          ciannData,
          experiments: [],
          availableBatches: availableBatches
        } 
      });
    } finally {
      setLoadingExperiments(false);
    }
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
            Assess - Select CIAAN
          </h2>
          {availableBatches.length > 0 && (
            <div className="alert alert-info mt-3">
              <strong>Available Batches for Assessment:</strong> {availableBatches.join(", ")}
            </div>
          )}
        </div>
        <div className="ciann-card-container">
          {loading ? (
            <p>Loading CIAANs...</p>
          ) : loadingExperiments ? (
            <p>Loading experiments...</p>
          ) : ciannDataList.length > 0 ? (
            ciannDataList.map((ciannData) => (
              <div
                key={ciannData._id}
                className={`ciann-dashboard-card ${loadingExperiments ? 'disabled' : ''}`}
                onClick={() => !loadingExperiments && handleCardClick(ciannData)} // 👈 click event with loading check
                style={{ 
                  cursor: loadingExperiments ? 'not-allowed' : 'pointer',
                  opacity: loadingExperiments ? 0.6 : 1 
                }}
              >
                <i className="bi bi-pencil-square ciann-icon"></i>
                <div className="ciann-id">CIAAN ID: {ciannData.ciannId}</div>
                <p className="card-text">
                  <strong>{ciannData.subject?.name}</strong>
                  <br />
                  ({ciannData.subject?.code})
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

export default AssismentCiaanCards;
