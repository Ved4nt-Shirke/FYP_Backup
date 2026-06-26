// src/components/assisment/assisment/EditAssess.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../basic/Header';
import './EditAssess.css';

export default function EditAssess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ciannData } = location.state || {};

  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!ciannData) {
        setError("CIAAN information is missing. Please select a CIAAN first.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches?ciannId=${ciannData.ciannId}&division=${ciannData.division}`
        );
        const data = await response.json();
        if (data.success) {
          setBatches(data.batches || []);
        } else {
          setError(data.message || "Failed to fetch batches");
        }
      } catch (err) {
        console.error("Error fetching batches:", err);
        setError("Failed to fetch available batches from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [ciannData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) {
      alert('Please select a batch first.');
      return;
    }

    try {
      setLoadingSubmit(true);
      // Fetch assessed experiments for this batch and ciannId
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/assessed-experiments?batch=${selectedBatch}&ciannId=${ciannData.ciannId}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assessed experiments');
      }
      
      if (data.success && data.experiments && data.experiments.length > 0) {
        // Navigate to edit experiment list page with assessed experiments
        navigate('/assessment/edit-prog', {
          state: { 
            batch: selectedBatch, 
            ciannData,
            assessedExperiments: data.experiments
          },
        });
      } else {
        alert("No assessed experiments found for this batch. Please complete some assessments first.");
      }
    } catch (err) {
      console.error("Error fetching assessed experiments:", err);
      alert("Error loading assessed experiments. Please try again.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      <Header showSearch={false} />
      <div className="assessment-page-container">
        <div className="assessment-container">
          <h2>Batch Selection Assessment</h2>
          
          {ciannData && (
            <div className="alert alert-info w-100 mb-4" style={{ borderRadius: '8px' }}>
              <strong>Selected CIAAN ID:</strong> {ciannData.ciannId}
              <br />
              <strong>Subject:</strong> {ciannData.subject?.name} ({ciannData.subject?.code})
              <br />
              <strong>Division:</strong> {ciannData.division}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 w-100">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading batches...</span>
              </div>
              <p className="mt-2 text-muted">Loading available batches...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger w-100 mb-4" style={{ borderRadius: '8px' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="batch-select">Select Batch:</label>
              <select
                id="batch-select"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={loadingSubmit}
              >
                <option value="">-- Select Batch --</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              
              {batches.length === 0 && (
                <div className="text-warning mb-3">
                  No batches found for division {ciannData?.division}.
                </div>
              )}

              <button type="submit" disabled={loadingSubmit || batches.length === 0}>
                {loadingSubmit ? 'Loading...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
