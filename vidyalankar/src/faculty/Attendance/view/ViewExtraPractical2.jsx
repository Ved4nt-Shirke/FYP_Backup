import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../../../basic/Header";
import "./ViewBatchSelect.css";

const ViewExtraPractical2 = () => {
  const [extraPracticalData, setExtraPracticalData] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Data Fetching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ciannId = searchParams.get("ciannId");

    if (!ciannId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchExtraPracticalData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/view-extra-practical/${ciannId}`,
        );
        setExtraPracticalData(response.data);
        // Set first batch as default if available
        if (response.data.batches && response.data.batches.length > 0) {
          setSelectedBatch(response.data.batches[0].batch);
        }
      } catch (err) {
        console.error("Error fetching extra practical data:", err);
        setError(
          "Failed to fetch extra practical attendance data. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExtraPracticalData();
  }, [location.search]);

  // Event Handlers
  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
  };

  const handleSubmit = () => {
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const ciannId = searchParams.get("ciannId");
    window.open(
      `/view-extra-practical3?ciannId=${ciannId}&batch=${selectedBatch}`,
      "_blank",
    );
  };

  // Render Logic
  if (loading) {
    return (
      <div className="vbs-state">
        Loading extra practical attendance data...
      </div>
    );
  }

  if (error) {
    return <div className="vbs-state error">{error}</div>;
  }

  if (
    !extraPracticalData ||
    !extraPracticalData.batches ||
    extraPracticalData.batches.length === 0
  ) {
    return (
      <div className="vbs-state">
        No extra practical attendance data found for this CIANN.
      </div>
    );
  }

  const { batches } = extraPracticalData;

  return (
    <>
      <Header showSearch={false} />
      <div className="vbs-page">
        <section className="vbs-hero">
          <h2>View Extra Practical Attendance</h2>
          <p>Select a batch to continue.</p>
        </section>
        <section className="vbs-panel">
          <div className="vbs-field">
            <label htmlFor="batchSelect">Available Batches</label>
            <select
              id="batchSelect"
              value={selectedBatch}
              onChange={handleBatchChange}
            >
              <option value="">-- Select a Batch --</option>
              {batches.map((batch) => (
                <option key={batch.batch} value={batch.batch}>
                  {batch.batch}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="vbs-submit"
            onClick={handleSubmit}
            disabled={!selectedBatch}
          >
            View Extra Practical Attendance
          </button>
        </section>
      </div>
    </>
  );
};

export default ViewExtraPractical2;
