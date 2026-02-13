import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../components/EditCiann.css";

const ViewPractical2 = () => {
  const [practicalAttendanceData, setPracticalAttendanceData] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Data Fetching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ciannId = searchParams.get("ciannId");

    if (!ciannId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchPracticalAttendanceData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/view-practical-attendance/${ciannId}`
        );
        setPracticalAttendanceData(response.data);
        // Set first batch as default if available
        if (response.data.batches && response.data.batches.length > 0) {
          setSelectedBatch(response.data.batches[0].batch);
        }
      } catch (err) {
        console.error("Error fetching practical attendance data:", err);
        setError("Failed to fetch practical attendance data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPracticalAttendanceData();
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
    window.open(`/view-practical3?ciannId=${ciannId}&batch=${selectedBatch}`, '_blank');
  };

  // Render Logic
  if (loading) {
    return (
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            Loading Practical Attendance Data...
          </h2>
        </div>
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-danger text-white">
            Error Loading Data
          </h2>
        </div>
        <div className="text-center p-4">
          <p className="text-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!practicalAttendanceData || !practicalAttendanceData.batches || practicalAttendanceData.batches.length === 0) {
    return (
      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-warning text-white">
            No Data Found
          </h2>
        </div>
        <div className="text-center p-4">
          <p>No practical attendance data found for this CIAAN.</p>
        </div>
      </div>
    );
  }

  const { batches } = practicalAttendanceData;

  return (
    <>
      {/* Bootstrap Icons */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />

      <div className="edit-ciann-page">
        <div className="edit-ciann-header">
          <h2 className="text-center py-2 bg-success text-white">
            View Practical Attendance - Select Batch
          </h2>
        </div>
        
        <div className="container mt-4">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title text-center mb-4">
                    <i className="bi bi-people-fill me-2"></i>
                    Select Batch to View Attendance
                  </h5>
                  
                  <div className="mb-3">
                    <label htmlFor="batchSelect" className="form-label">
                      <strong>Available Batches:</strong>
                    </label>
                    <select
                      id="batchSelect"
                      className="form-select form-select-lg"
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
                  
                  <div className="text-center">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={!selectedBatch}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Attendance
                    </button>
                  </div>
                  
                  {selectedBatch && (
                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        Selected: <strong>{selectedBatch}</strong>
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPractical2;
