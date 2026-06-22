import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";
import "../assess/AssessPA.css";

export default function EditAssessmentOverview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ciannData } = location.state || {};

  const [assessmentData, setAssessmentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ciannData) {
      fetchAllAssessments();
    } else {
      setError("CIAAN information is missing");
      setLoading(false);
    }
  }, [ciannData]);

  const fetchAllAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching assessments for CIANN:", ciannData.ciannId);

      // Fetch all assessed experiments grouped by batch
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/all-assessed-experiments?ciannId=${ciannData.ciannId}`,
      );
      const data = await response.json();

      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch assessment data");
      }

      if (data.success) {
        // Group by batch
        const groupedData = {};
        if (data.experiments && data.experiments.length > 0) {
          console.log("Processing experiments:", data.experiments);
          data.experiments.forEach((exp) => {
            if (!groupedData[exp.batch]) {
              groupedData[exp.batch] = [];
            }
            groupedData[exp.batch].push(exp);
          });
          console.log("Grouped data:", groupedData);
        }
        setAssessmentData(groupedData);
      } else {
        setAssessmentData({});
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
      setError(error.message);
      setAssessmentData({});
    } finally {
      setLoading(false);
    }
  };

  const handleEditMarks = (batch, experiment) => {
    console.log("Editing marks for:", { batch, experiment });
    navigate("/edit-assessed-students", {
      state: {
        experiment: {
          id: experiment.id || experiment.experimentId,
          name: experiment.name || experiment.experimentName,
        },
        batch: batch,
        ciannData: ciannData,
      },
    });
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading assessment data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showSearch={false} />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <style>{`
        .overview-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .page-header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .page-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
        }
        .ciann-info-card {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border: none;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }
        .ciann-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .info-label {
          font-weight: 600;
          color: #1976d2;
          min-width: 80px;
        }
        .info-value {
          color: #333;
        }
        .section-header {
          font-size: 1.3rem;
          font-weight: 600;
          color: #333;
          margin: 30px 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 3px solid #28a745;
        }
        .batch-card {
          border: none;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 25px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .batch-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        .batch-header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 18px 25px;
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .batch-body {
          padding: 0;
        }
        .experiments-table {
          margin: 0;
          border: none;
        }
        .experiments-table thead th {
          background: #f8f9fa;
          color: #495057;
          font-weight: 600;
          padding: 15px 20px;
          border-bottom: 2px solid #dee2e6;
        }
        .experiments-table tbody tr {
          transition: background-color 0.2s;
        }
        .experiments-table tbody tr:hover {
          background-color: #f1f8f4;
        }
        .experiments-table tbody td {
          padding: 18px 20px;
          vertical-align: middle;
        }
        .exp-id-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          display: inline-block;
        }
        .exp-name {
          font-weight: 500;
          color: #333;
        }
        .student-count {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
        }
        .edit-btn {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .edit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
        }
        .no-data-card {
          background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
          border: none;
          border-radius: 10px;
          padding: 30px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .no-data-icon {
          font-size: 3rem;
          color: #856404;
          margin-bottom: 15px;
        }
        .error-card {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);
          border: none;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .back-btn {
          background: #6c757d;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: #5a6268;
          transform: translateX(-2px);
        }
      `}</style>

      <div className="overview-container">
        <div className="page-header">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="page-title">
              <i className="bi bi-pencil-square me-2"></i>
              Edit Progressive Assessment
            </h1>
            <button
              className="btn back-btn text-white"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i> Back
            </button>
          </div>
        </div>

        {ciannData && (
          <div className="ciann-info-card">
            <div className="ciann-info-grid">
              <div className="info-item">
                <i className="bi bi-hash" style={{ color: "#1976d2" }}></i>
                <span className="info-label">CIAAN ID:</span>
                <span className="info-value">{ciannData.ciannId}</span>
              </div>
              <div className="info-item">
                <i className="bi bi-book" style={{ color: "#1976d2" }}></i>
                <span className="info-label">Subject:</span>
                <span className="info-value">
                  {ciannData.subject?.name || "N/A"} (
                  {ciannData.subject?.code || "N/A"})
                </span>
              </div>
              <div className="info-item">
                <i className="bi bi-grid-3x3" style={{ color: "#1976d2" }}></i>
                <span className="info-label">Division:</span>
                <span className="info-value">
                  {ciannData.division || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <i
                  className="bi bi-mortarboard"
                  style={{ color: "#1976d2" }}
                ></i>
                <span className="info-label">Course:</span>
                <span className="info-value">
                  {ciannData.courseCode || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i
                  className="bi bi-exclamation-triangle"
                  style={{ fontSize: "1.5rem", color: "#842029" }}
                ></i>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
              <button
                className="btn btn-outline-danger"
                onClick={fetchAllAssessments}
              >
                <i className="bi bi-arrow-clockwise me-2"></i> Retry
              </button>
            </div>
          </div>
        )}

        {Object.keys(assessmentData).length === 0 ? (
          <div className="no-data-card">
            <div className="no-data-icon">
              <i className="bi bi-inbox"></i>
            </div>
            <h4 style={{ color: "#856404", marginBottom: "10px" }}>
              No Assessed Experiments Found
            </h4>
            <p className="mb-0" style={{ color: "#856404" }}>
              No assessment data is available for this CIAAN. Please complete
              some assessments first.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="section-header">
              <i className="bi bi-list-check me-2"></i>
              Select Batch and Experiment to Edit Marks
            </h2>
            {Object.keys(assessmentData)
              .sort()
              .map((batch) => (
                <div key={batch} className="batch-card">
                  <div className="batch-header">
                    <i className="bi bi-people-fill"></i>
                    Batch: {batch}
                    <span className="badge bg-light text-dark ms-2">
                      {assessmentData[batch].length} Experiment
                      {assessmentData[batch].length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="batch-body">
                    <div className="table-responsive">
                      <table className="table experiments-table mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: "120px" }}>Exp ID</th>
                            <th>Experiment Name</th>
                            <th style={{ width: "180px" }}>
                              Students Assessed
                            </th>
                            <th style={{ width: "150px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessmentData[batch].map((exp, index) => (
                            <tr key={index}>
                              <td>
                                <span className="exp-id-badge">
                                  {exp.id || exp.experimentId || index + 1}
                                </span>
                              </td>
                              <td>
                                <div className="exp-name">
                                  {exp.name || exp.experimentName || "N/A"}
                                </div>
                              </td>
                              <td>
                                <div className="student-count">
                                  <i className="bi bi-person-check"></i>
                                  <span>
                                    {exp.studentCount !== undefined
                                      ? exp.studentCount
                                      : "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn edit-btn btn-primary text-white"
                                  onClick={() => handleEditMarks(batch, exp)}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                  Edit Marks
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
