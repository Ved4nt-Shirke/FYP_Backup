import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewAttend2.css"; // Using the same stylesheet

const ViewExtraPractical3 = () => {
  const [batchAttendanceData, setBatchAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Data Fetching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ciannId = searchParams.get("ciannId");
    const batch = searchParams.get("batch");

    if (!ciannId || !batch) {
      setError("CIAAN ID or Batch is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchBatchAttendanceData = async () => {
      try {
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/view-extra-practical/${ciannId}/${batch}`,
        );
        setBatchAttendanceData(response.data);
      } catch (err) {
        console.error("Error fetching batch attendance data:", err);
        setError(
          "Failed to fetch batch attendance data. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBatchAttendanceData();
  }, [location.search]);

  // Event Handlers
  const handlePrint = () => {
    window.print();
  };

  // Helper to format date as DD-MM
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };

  // Render Logic
  if (loading) {
    return (
      <div className="vat2-state">
        Loading extra practical attendance details...
      </div>
    );
  }

  if (error) {
    return <div className="vat2-state">{error}</div>;
  }

  if (
    !batchAttendanceData ||
    !batchAttendanceData.experiments ||
    batchAttendanceData.experiments.length === 0
  ) {
    return (
      <div className="vat2-state">
        No extra practical attendance data found for this batch.
      </div>
    );
  }

  const { batch, experiments } = batchAttendanceData;

  // Get all unique students from all experiments
  const allStudents = new Map();
  experiments.forEach((experiment) => {
    if (experiment.students) {
      experiment.students.forEach((student) => {
        if (!allStudents.has(student.rollId)) {
          allStudents.set(student.rollId, {
            rollId: student.rollId,
            name: student.name,
          });
        }
      });
    }
  });

  const studentsList = Array.from(allStudents.values()).sort((a, b) =>
    a.rollId.localeCompare(b.rollId, undefined, { numeric: true }),
  );

  return (
    <div className="vat2-page">
      <header className="vat2-hero">
        <h1>View Extra Practical Attendance - Batch {batch}</h1>
        <p>
          {studentsList.length} students and {experiments.length} experiments
        </p>
      </header>

      <section className="vat2-panel">
        <div className="vat2-table-wrapper">
          <table className="vat2-table">
            <thead>
              <tr>
                <th>ROLL NO.</th>
                {experiments.map((experiment, index) => (
                  <th key={index}>
                    {experiment.experiments}
                    <>
                      <br />
                      <small>{formatDate(experiment.actualDate)}</small>
                    </>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsList.map((student) => (
                <tr key={student.rollId}>
                  <td>{student.rollId}</td>
                  {experiments.map((experiment, expIndex) => {
                    let studentStatus = "-";

                    if (experiment.students) {
                      const studentRecord = experiment.students.find(
                        (s) => s.rollId === student.rollId,
                      );
                      if (studentRecord) {
                        studentStatus =
                          studentRecord.attendance === "Present" ? "P" : "A";
                      }
                    }

                    return (
                      <td key={`${student.rollId}-${expIndex}`}>
                        <span
                          className={
                            studentStatus === "P"
                              ? "vat2-status vat2-status--present"
                              : studentStatus === "A"
                                ? "vat2-status vat2-status--absent"
                                : ""
                          }
                        >
                          {studentStatus}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary for experiments */}
        <div className="mt-4">
          <h5>Summary:</h5>
          <div className="row">
            {experiments.map((experiment, index) => (
              <div key={index} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">{experiment.experiments}</h6>
                    <p className="card-text">
                      <strong>Date:</strong> {formatDate(experiment.actualDate)}
                      <br />
                      <strong>Present:</strong> {experiment.presentCount}/
                      {experiment.studentsCount}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vat2-actions">
          <button
            type="button"
            className="vat2-print-btn"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </section>
    </div>
  );
};

export default ViewExtraPractical3;
