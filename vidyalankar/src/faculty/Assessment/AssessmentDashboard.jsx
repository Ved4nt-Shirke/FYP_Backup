import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import "./AssessmentDashboard.css";

export default function AssessmentDashboard() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batches`
        );
        const data = await response.json();
        if (data.success) {
          setBatches(data.batches);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      }
    };
    fetchBatches();
  }, []);

  const fetchStatistics = async (batch) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/batch-statistics?batch=${encodeURIComponent(batch)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch statistics");
      }

      if (data.success) {
        setStatistics(data.statistics);
      } else {
        throw new Error(data.message || "Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError(error.message);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchChange = (batch) => {
    setSelectedBatch(batch);
    if (batch) {
      fetchStatistics(batch);
    } else {
      setStatistics(null);
    }
  };

  const handleNewAssessment = () => {
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }
    navigate("/assessment/batch-select", { state: { batch: selectedBatch } });
  };

  const handleEditAssessment = () => {
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }
    navigate("/assessment/edit-prog", { state: { batch: selectedBatch } });
  };

  const handleViewReports = () => {
    if (!selectedBatch) {
      alert("Please select a batch first.");
      return;
    }
    navigate("/assessment/reports", { state: { batch: selectedBatch } });
  };

  return (
    <>
      <Header />
      <div
        className="container-fluid"
        style={{ margin: "0", padding: "15px", maxWidth: "none" }}
      >
        <div className="row">
          <div className="col-12">
            <h2 className="mb-3">Assessment Dashboard</h2>

            {/* Batch Selection */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Select Batch</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <select
                      className="form-select"
                      value={selectedBatch}
                      onChange={(e) => handleBatchChange(e.target.value)}
                    >
                      <option value="">-- Select Batch --</option>
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleNewAssessment}
                        disabled={!selectedBatch}
                      >
                        <i className="bi bi-plus-circle"></i> New Assessment
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleEditAssessment}
                        disabled={!selectedBatch}
                      >
                        <i className="bi bi-pencil"></i> Edit Assessment
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-info"
                        onClick={handleViewReports}
                        disabled={!selectedBatch}
                      >
                        <i className="bi bi-file-text"></i> View Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading statistics...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {error}
                <button
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() =>
                    selectedBatch && fetchStatistics(selectedBatch)
                  }
                >
                  Retry
                </button>
              </div>
            )}

            {/* Statistics */}
            {statistics && selectedBatch && (
              <div className="row">
                <div className="col-12">
                  <h4>Statistics for {selectedBatch}</h4>
                </div>

                {/* Summary Cards */}
                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title text-primary">
                        {statistics.totalAssessments}
                      </h5>
                      <p className="card-text">Total Assessments</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title text-success">
                        {statistics.totalStudentAssessments}
                      </h5>
                      <p className="card-text">Student Assessments</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title text-warning">
                        {statistics.averageMarks}%
                      </h5>
                      <p className="card-text">Average Marks</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card text-center">
                    <div className="card-body">
                      <h5 className="card-title text-info">
                        {statistics.experimentsAssessed.length}
                      </h5>
                      <p className="card-text">Experiments Assessed</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Experiment Statistics */}
                {statistics.experimentsAssessed.length > 0 && (
                  <div className="col-12 mt-4">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Experiment-wise Statistics</h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>Exp ID</th>
                                <th>Experiment Name</th>
                                <th>Students Assessed</th>
                                <th>Average Marks</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statistics.experimentsAssessed.map((exp) => (
                                <tr key={exp.experimentId}>
                                  <td>{exp.experimentId}</td>
                                  <td>{exp.experimentName}</td>
                                  <td>{exp.studentsCount}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        exp.averageMarks >= 70
                                          ? "bg-success"
                                          : exp.averageMarks >= 50
                                          ? "bg-warning"
                                          : "bg-danger"
                                      }`}
                                    >
                                      {exp.averageMarks.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-primary me-1"
                                      onClick={() =>
                                        navigate("/assess-pa-studentlist", {
                                          state: {
                                            experiment: {
                                              id: exp.experimentId,
                                              name: exp.experimentName,
                                            },
                                            batch: selectedBatch,
                                            isEditMode: true,
                                          },
                                        })
                                      }
                                    >
                                      <i className="bi bi-pencil"></i> Edit
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-info"
                                      onClick={() =>
                                        navigate(
                                          "/assessment/experiment-report",
                                          {
                                            state: {
                                              experiment: {
                                                id: exp.experimentId,
                                                name: exp.experimentName,
                                              },
                                              batch: selectedBatch,
                                            },
                                          }
                                        )
                                      }
                                    >
                                      <i className="bi bi-eye"></i> View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Data State */}
            {statistics &&
              statistics.totalAssessments === 0 &&
              selectedBatch && (
                <div className="text-center mt-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">No Assessments Found</h5>
                      <p className="card-text">
                        No assessments have been completed for {selectedBatch}{" "}
                        yet.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={handleNewAssessment}
                      >
                        <i className="bi bi-plus-circle"></i> Create First
                        Assessment
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

    </>
  );
}
