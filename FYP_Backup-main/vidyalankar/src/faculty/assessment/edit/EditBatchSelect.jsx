// src/Assessment/AssessBatchSelect.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "../assessBatchselect.css";

export default function EditBatchSelect() {
  const location = useLocation();
  const navigate = useNavigate();
  const CiaanData = location.state?.CiaanData;
  const experiments = location.state?.experiments || [];
  const availableBatches = location.state?.availableBatches || [];
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicBatches, setDynamicBatches] = useState([]);

  // Default batch options as fallback
  const defaultBatches = ["B1", "B2", "B3"];

  // Fetch batches if not provided from previous page
  useEffect(() => {
    const fetchBatches = async () => {
      if (availableBatches.length === 0) {
        try {
          const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches`);
          const data = await response.json();
          if (data.success && data.batches && data.batches.length > 0) {
            setDynamicBatches(data.batches);
          } else {
            // Use default batches if API doesn't return any
            console.log("No batches from API, using default batches");
            setDynamicBatches(defaultBatches);
          }
        } catch (error) {
          console.error("Error fetching batches:", error);
          // Use default batches on error
          console.log("API error, using default batches");
          setDynamicBatches(defaultBatches);
        }
      } else {
        setDynamicBatches(availableBatches);
      }
    };
    fetchBatches();
  }, [availableBatches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) {
      alert("Please select a batch.");
      return;
    }

    if (!CiaanData || !CiaanData.subject) {
      alert("Subject information is missing. Please go back and select a valid CIAAN.");
      return;
    }

    setLoading(true);

    try {
      // Fetch assessed experiments for this batch, scoped to this Ciaan
      const aeParams = new URLSearchParams({ batch: selectedBatch });
      if (CiaanData?.CiaanId) aeParams.append("CiaanId", CiaanData.CiaanId);
      const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/assessed-experiments?${aeParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assessed experiments');
      }

      if (data.success && data.experiments.length > 0) {
        // Navigate to edit experiment list page with assessed experiments
        navigate("/assessment/edit-prog", {
          state: {
            batch: selectedBatch,
            CiaanData,
            assessedExperiments: data.experiments
          },
        });
      } else {
        alert("No assessed experiments found for this batch. Please complete some assessments first.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching assessed experiments:", error);
      alert("Error loading assessed experiments. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="container my-4 assess-batch-select-page">
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Batch Selection
        </h3>
        {CiaanData && (
          <div className="alert alert-info">
            <strong>Selected CIAAN ID:</strong> {CiaanData.CiaanId}
            <br />
            <strong>Subject:</strong> {CiaanData.subject?.name} ({CiaanData.subject?.code})
            <br />
            <strong>Division:</strong> {CiaanData.division}
            <br />
            <strong>Available Experiments:</strong> {experiments.length > 0 ? experiments.length : "No experiments found"}
          </div>
        )}

        {experiments.length > 0 && (
          <div className="alert alert-secondary">
            <h5>Available Experiments:</h5>
            <ul className="mb-0">
              {experiments.map((exp, index) => (
                <li key={index}>
                  <strong>Practical {exp.practicalNo}:</strong> {exp.practicalName}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <select
            className="form-control mb-3"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">-- Select Batch --</option>
            {dynamicBatches.map((batch, index) => (
              <option key={index} value={batch}>
                {batch}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>
      </div>

    </>
  );
}
