// src/components/assisment/assisment/EditProgAssess.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../basic/Header";
import "./EditProgAssess.css";

function EditProgAssess() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state || {};
  const batch = stateData.batch || "Unknown";
  const assessedExperiments = stateData.assessedExperiments;

  const [ciannData, setCiannData] = useState(stateData.ciannData || null);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ciannData) {
      try {
        const stored = localStorage.getItem("ciannData");
        if (stored) {
          setCiannData(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Error reading ciannData in EditProgAssess:", e);
      }
    }
  }, [ciannData]);

  useEffect(() => {
    if (assessedExperiments && assessedExperiments.length > 0) {
      // Use the experiments passed from EditBatchSelect
      setExperiments(assessedExperiments);
      setLoading(false);
    } else {
      // Fallback: fetch assessed experiments if not passed
      fetchAssessedExperiments();
    }
  }, [assessedExperiments, ciannData]);

  const fetchAssessedExperiments = async () => {
    try {
      setLoading(true);
      setError(null);

      let ciannIdParam = "";
      if (ciannData && ciannData.ciannId) {
        ciannIdParam = `&ciannId=${ciannData.ciannId}`;
      } else {
        const stored = localStorage.getItem("ciannData");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.ciannId) {
              ciannIdParam = `&ciannId=${parsed.ciannId}`;
            }
          } catch (e) {}
        }
      }

      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/assessments/assessed-experiments?batch=${batch}${ciannIdParam}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch assessed experiments");
      }

      if (data.success) {
        setExperiments(data.experiments || []);
      } else {
        throw new Error(data.message || "Failed to fetch assessed experiments");
      }
    } catch (error) {
      console.error("Error fetching assessed experiments:", error);
      setError(error.message);
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (expId, expName) => {
    // Navigate to edit assessment page with experiment data
    navigate("/assess-pa-studentlist", {
      state: {
        experiment: { id: expId, name: expName },
        batch: batch,
        ciannData: ciannData,
        isEditMode: true, // Flag to indicate this is edit mode
      },
    });
  };

  if (loading) {
    return (
      <>
        <Header showSearch={false} />
        <div
          className="container-fluid"
          style={{ padding: "15px", maxWidth: "none" }}
        >
          <h3 className="text-center bg-success text-white p-2 rounded">
            Course Diary - Edit Progressive Assessment - Batch {batch}
          </h3>
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
      <Header showSearch={false} />
      <div
        className="container-fluid"
        style={{ padding: "15px", maxWidth: "none" }}
      >
        <h3 className="text-center bg-success text-white p-2 rounded">
          Course Diary - Edit Progressive Assessment - Batch {batch}
        </h3>

        {ciannData && (
          <div className="alert alert-info">
            <strong>CIAAN ID:</strong> {ciannData.ciannId}
            <br />
            <strong>Subject:</strong> {ciannData.subject?.name} (
            {ciannData.subject?.code})
            <br />
            <strong>Division:</strong> {ciannData.division}
            <br />
            <strong>Assessed Experiments:</strong> {experiments.length}
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

        <div className="table-responsive">
          <table className="table table-bordered table-hover table-striped">
            <thead className="table-light">
              <tr>
                <th style={{ width: "10%", textAlign: "center" }}>Exp ID</th>
                <th style={{ width: "70%", textAlign: "left" }}>Exp Name</th>
                <th style={{ width: "20%", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {experiments.length > 0 ? (
                experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ textAlign: "center" }}>{exp.id}</td>
                    <td style={{ textAlign: "left" }}>{exp.name}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-success"
                        onClick={() => handleEditClick(exp.id, exp.name)}
                      >
                        <i className="bi bi-pencil-fill"></i> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    {error
                      ? "Failed to load experiments"
                      : "No assessed experiments found. Complete some assessments first."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </>
  );
}

export default EditProgAssess;
