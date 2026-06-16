import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

import "../assess/AssessPA.css";

export default function EditExperimentList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { batch, ciannData, assessedExperiments: passedExperiments } = location.state || {};
  
  const [assessedExperiments, setAssessedExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (passedExperiments && passedExperiments.length > 0) {
      // Use the experiments passed from EditBatchSelect
      setAssessedExperiments(passedExperiments);
      setLoading(false);
    } else if (batch) {
      // Fallback: fetch assessed experiments if not passed
      fetchAssessedExperiments();
    } else {
      setError("Batch information is missing");
      setLoading(false);
    }
  }, [batch, passedExperiments]);

  const fetchAssessedExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching assessed experiments for batch:', batch);
      
      const response = await fetch(`http://localhost:5000/api/assessments/assessed-experiments?batch=${batch}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assessed experiments');
      }
      
      if (data.success) {
        setAssessedExperiments(data.experiments || []);
        console.log('Assessed experiments loaded:', data.experiments?.length || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch assessed experiments');
      }
    } catch (error) {
      console.error('Error fetching assessed experiments:', error);
      setError(error.message);
      setAssessedExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExperiment = (experiment) => {
    console.log('Editing experiment:', experiment);
    
    // Navigate to EditAssessedStudentList for editing existing assessment data
    navigate("/edit-assessed-students", {
      state: {
        experiment: {
          id: experiment.id,
          name: experiment.name
        },
        batch: batch,
        ciannData: ciannData
      },
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mt-4">
          <h3 className="assess-title">Edit Progressive Assessment - Batch {batch}</h3>
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading assessed experiments...</p>
          </div>
        </div>

      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h3 className="assess-title">Edit Progressive Assessment - Batch {batch}</h3>

        {batch && ciannData && (
          <div className="alert alert-info">
            <strong>Batch:</strong> {batch} <br />
            <strong>CIAAN ID:</strong> {ciannData.ciannId || "N/A"} <br />
            <strong>Subject:</strong> {ciannData.subject?.name || "N/A"} ({ciannData.subject?.code || "N/A"}) <br />
            <strong>Division:</strong> {ciannData.division || "N/A"} <br />
            <strong>Mode:</strong> <span className="badge bg-warning text-dark">Edit Mode</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchAssessedExperiments}
            >
              Retry
            </button>
          </div>
        )}

        <div className="d-flex justify-content-between mb-3">
          <div>
            <h5>Assessed Experiments ({assessedExperiments.length})</h5>
            <p className="text-muted">These experiments have assessment data that can be edited.</p>
          </div>
          <div>
            <button 
              className="btn btn-outline-secondary me-2"
              onClick={fetchAssessedExperiments}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-light">
              <tr>
                <th>Exp ID</th>
                <th>Exp Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assessedExperiments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    {error ? (
                      <div>
                        <i className="bi bi-exclamation-triangle text-warning"></i>
                        <br />
                        Failed to load assessed experiments
                      </div>
                    ) : (
                      <div>
                        <i className="bi bi-info-circle text-info"></i>
                        <br />
                        No assessed experiments found for this batch.
                        <br />
                        <small className="text-muted">Complete some assessments first to see them here for editing.</small>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                assessedExperiments.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <strong>{exp.id}</strong>
                    </td>
                    <td>
                      <div className="experiment-name">
                        {exp.name}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle"></i> Assessed
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-warning btn-sm"
                        onClick={() => handleEditExperiment(exp)}
                        title="Edit marks for this experiment"
                      >
                        <i className="bi bi-pencil-fill"></i> Edit Marks
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {assessedExperiments.length > 0 && (
          <div className="alert alert-light">
            <h6><i className="bi bi-info-circle"></i> How to Edit:</h6>
            <ul className="mb-0">
              <li>Click "Edit Marks" to modify student marks for that experiment</li>
              <li>You can update marks for individual students</li>
              <li>Changes will be saved to the database when you submit</li>
              <li>Original assessment data will be preserved as backup</li>
            </ul>
          </div>
        )}

        <div className="mt-4">
          <small className="text-muted">
            <strong>Note:</strong> This page shows only experiments that have been assessed and have data in the database. 
            To assess new experiments, go to the regular assessment page.
          </small>
        </div>
      </div>

    </>
  );
}
