import React, { useEffect, useState } from "react";
import "./ViewAssessment.css";

const ViewAssessment = () => {
  // ... (all your existing state and useEffect code remains the same) ...
  const [assessments, setAssessments] = useState([]);
  const [assessedExperiments, setAssessedExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchName, setBatchName] = useState("");
  const [CiaanData, setCiaanData] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);

        const batch = sessionStorage.getItem("viewPA_batch");
        const storedCiaanData = sessionStorage.getItem("viewPA_CiaanData");

        if (!batch || batch.trim() === "") {
          throw new Error("No batch selected. Please select a batch first.");
        }

        setBatchName(batch);

        if (storedCiaanData) {
          setCiaanData(JSON.parse(storedCiaanData));
        }

        const response = await fetch(`/api/assessments/batch/${encodeURIComponent(batch)}`);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch assessments");
        }

        if (!Array.isArray(data.data)) {
          throw new Error("Invalid data format received from server");
        }

        const validAssessments = data.data.filter(student =>
          student && typeof student === 'object' && student.rollNo
        );

        if (validAssessments.length === 0) {
          setAssessments([]);
          setAssessedExperiments([]);
          return;
        }

        setAssessments(validAssessments);

        const experimentsWithMarks = new Set();
        validAssessments.forEach((student) => {
          if (student.assessments && typeof student.assessments === 'object') {
            Object.keys(student.assessments).forEach((expNum) => {
              const num = parseInt(expNum, 10);
              const marks = student.assessments[expNum]?.marks;
              if (!isNaN(num) && num > 0 && marks !== undefined && marks !== null && marks !== "" && marks !== "0") {
                experimentsWithMarks.add(num);
              }
            });
          }
        });

        const sortedExperiments = Array.from(experimentsWithMarks).sort((a, b) => a - b);
        setAssessedExperiments(sortedExperiments);

      } catch (err) {
        console.error("Error fetching assessments:", err);
        setError(err.message || "An unexpected error occurred while loading assessments");
        setAssessedExperiments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const formatMark = (mark) => {
    if (mark === undefined || mark === null || mark === "" || mark === "0") {
      return "—";
    }
    return String(mark);
  };

  // ... (loading and error JSX remains the same) ...

  if (loading) {
    return (
      <div className="view-assessment-page-wrapper">
        <div className="view-assessment-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mb-0">Loading assessments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-assessment-page-wrapper">
        <div className="view-assessment-container">
          <div className="text-center py-5">
            <div className="text-danger mb-3">
              <i className="fas fa-exclamation-triangle fa-3x"></i>
            </div>
            <h5 className="text-danger">Error Loading Assessments</h5>
            <p className="text-muted">{error}</p>
            <button
              className="btn btn-outline-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // NEW WRAPPER to enforce centering
    <div className="view-assessment-page-wrapper">
      <div className="view-assessment-container">
        <div className="assessment-content">
          {/* Header Section */}
          <div className="card shadow-sm mb-4 assessment-header-card">
            <div className="card-header bg-primary text-white">
              <div className="row align-items-center">
                <div className="col">
                  <h4 className="mb-0">
                    <i className="fas fa-chart-bar me-2"></i>
                    Progressive Assessment View
                  </h4>
                </div>
                <div className="col-auto">
                  <span className="badge bg-light text-dark">
                    Batch: {batchName}
                  </span>
                </div>
              </div>
            </div>

            {CiaanData && (
              <div className="card-body py-2">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Subject:</strong> {CiaanData.subject?.name}
                  </div>
                  <div className="col-md-6">
                    <strong>Division:</strong> {CiaanData.division}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assessment Table */}
          <div className="card shadow-sm assessment-table-wrapper">
            <div className="card-body p-0">
              {assessments.length > 0 && assessedExperiments.length > 0 ? (
                <div className="assessment-table-responsive">
                  {/* ... your table code ... */}
                  <table className="table table-sm table-hover assessment-table">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th className="text-center roll-no-header">Roll No.</th>
                        {assessedExperiments.map((expNum) => (
                          <th key={expNum} className="text-center">Exp {expNum}</th>
                        ))}
                        <th className="text-center total-header">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((student, index) => {
                        const totalMarks = assessedExperiments.reduce((sum, expNum) => {
                          const mark = student.assessments?.[expNum]?.marks;
                          const numMark = parseFloat(mark);
                          return sum + (isNaN(numMark) ? 0 : numMark);
                        }, 0);

                        return (
                          <tr key={student.rollNo || index} className="align-middle">
                            <td className="fw-bold text-center roll-no-cell">
                              {student.rollNo || `Student ${index + 1}`}
                            </td>
                            {assessedExperiments.map((expNum) => {
                              const mark = student.assessments?.[expNum]?.marks;
                              const formattedMark = formatMark(mark);
                              const isAbsent = formattedMark === "—";
                              return (
                                <td key={expNum} className={`text-center ${isAbsent ? 'text-muted' : 'fw-semibold'}`}>
                                  {formattedMark}
                                </td>
                              );
                            })}
                            <td className="text-center fw-bold total-cell">
                              {totalMarks > 0 ? totalMarks.toFixed(1) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  {/* ... no assessed experiments content ... */}
                </div>
              )}
            </div>

            {assessments.length > 0 && assessedExperiments.length > 0 && (
              <div className="card-footer bg-light">
                {/* ... card footer content ... */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAssessment;
