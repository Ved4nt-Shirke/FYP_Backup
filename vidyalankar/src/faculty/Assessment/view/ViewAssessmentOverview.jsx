import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../basic/Header";

export default function ViewAssessmentOverview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { CiaanData } = location.state || {};

  const [assessmentData, setAssessmentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (CiaanData) {
      fetchAllAssessments();
    } else {
      setError("CIAAN information is missing");
      setLoading(false);
    }
  }, [CiaanData]);

  const fetchAllAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching assessments for Ciaan:", CiaanData.CiaanId);

      // Fetch all assessed experiments grouped by batch
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/all-assessed-experiments?CiaanId=${CiaanData.CiaanId}`,
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

  const handleViewMarks = (batch, experiment) => {
    console.log("Viewing marks for:", { batch, experiment });
    navigate("/view-assessed-students", {
      state: {
        experiment: {
          id: experiment.id || experiment.experimentId,
          name: experiment.name || experiment.experimentName,
        },
        batch: batch,
        CiaanData: CiaanData,
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

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>View Assessment Marks</h4>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i> Back
          </button>
        </div>

        {CiaanData && (
          <div className="alert alert-info">
            <div className="row">
              <div className="col-md-3">
                <strong>CIAAN ID:</strong> {CiaanData.CiaanId}
              </div>
              <div className="col-md-4">
                <strong>Subject:</strong> {CiaanData.subject?.name || "N/A"} (
                {CiaanData.subject?.code || "N/A"})
              </div>
              <div className="col-md-2">
                <strong>Division:</strong> {CiaanData.division || "N/A"}
              </div>
              <div className="col-md-3">
                <strong>Course:</strong> {CiaanData.courseCode || "N/A"}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <button
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchAllAssessments}
            >
              Retry
            </button>
          </div>
        )}

        {Object.keys(assessmentData).length === 0 ? (
          <div className="alert alert-warning">
            <h5>No Assessed Experiments Found</h5>
            <p className="mb-0">
              No assessment data is available for this CIAAN. Please complete
              some assessments first.
            </p>
          </div>
        ) : (
          <div>
            <h5 className="mb-3">Select Batch and Experiment to View Marks</h5>
            {Object.keys(assessmentData)
              .sort()
              .map((batch) => (
                <div key={batch} className="card mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-people-fill"></i> Batch: {batch}
                      <span className="badge bg-light text-dark ms-2">
                        {assessmentData[batch].length} Experiment
                        {assessmentData[batch].length !== 1 ? "s" : ""}
                      </span>
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "100px" }}>Exp ID</th>
                            <th>Experiment Name</th>
                            <th style={{ width: "150px" }}>Students</th>
                            <th style={{ width: "120px" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessmentData[batch].map((exp, index) => (
                            <tr key={index}>
                              <td className="text-center">
                                <strong>
                                  {exp.id || exp.experimentId || index + 1}
                                </strong>
                              </td>
                              <td>{exp.name || exp.experimentName || "N/A"}</td>
                              <td className="text-center">
                                <i className="bi bi-person-check"></i>{" "}
                                {exp.studentCount !== undefined
                                  ? exp.studentCount
                                  : "N/A"}
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleViewMarks(batch, exp)}
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
              ))}
          </div>
        )}
      </div>
    </>
  );
}
