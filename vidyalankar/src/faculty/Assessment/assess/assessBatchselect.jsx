// src/Assessment/AssessBatchSelect.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "../assessBatchselect.css";

export default function AssessBatchSelect() {
  const location = useLocation();
  const navigate = useNavigate();
  const ciannData = location.state?.ciannData;
  const experiments = location.state?.experiments || [];
  const availableBatches = location.state?.availableBatches || [];
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicBatches, setDynamicBatches] = useState([]);
  
  // Default batch options as fallback
  const defaultBatches = ["B1", "B2", "B3", "B4", "B5"];

  // Fetch batches if not provided from previous page
  useEffect(() => {
    const fetchBatches = async () => {
      if (availableBatches.length === 0) {
        try {
          const response = await fetch("http://localhost:5000/api/assessments/batches");
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

    if (!ciannData || !ciannData.subject) {
      alert("Subject information is missing. Please go back and select a valid CIAAN.");
      return;
    }

    setLoading(true);
    
    try {
      // Navigate to the unified assessment page with batch, subject data, and experiments
      navigate("/assess-pa", {
        state: { 
          batch: selectedBatch, 
          ciannData,
          experiments, // Pass the experiments data
          // Pass subject details for fetching experiments - matching your DB structure
          program: ciannData.department?.name || "Computer Engineering", // Use actual department name
          className: ciannData.courseCode || ciannData.class || ciannData.division || "CO1A", // Use actual class
          course: ciannData.subject?.name || "BASIC MATHEMATICS" // Use actual subject name
        },
      });
    } catch (error) {
      console.error("Error navigating to assessment:", error);
      alert("Error loading assessment page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showSearch={false} />
      <div 
        className="container-fluid"
        style={{ padding: '15px', maxWidth: 'none' }}
      >
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Batch Selection
        </h3>
        {ciannData && (
          <div className="alert alert-info">
            <strong>Selected CIAAN ID:</strong> {ciannData.ciannId}
            <br />
            <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code})
            <br />
            <strong>Division:</strong> {ciannData.division}
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
