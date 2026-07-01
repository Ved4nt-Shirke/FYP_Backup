import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewAttend2.css"; // Using the same stylesheet

const ViewPractical3 = () => {
  const [batchAttendanceData, setBatchAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Data Fetching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const CiaanId = searchParams.get("CiaanId");
    const batch = searchParams.get("batch");

    if (!CiaanId || !batch) {
      setError("CIAAN ID or Batch is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchBatchAttendanceData = async () => {
      try {
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/view-practical-attendance/${CiaanId}/${batch}`,
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
      <div className="vat2-state">Loading batch attendance details...</div>
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
        No practical attendance data found for this batch.
      </div>
    );
  }

  const { batch, weeks, experiments } = batchAttendanceData;

  // Get all unique students from all experiments
  const allStudents = new Map();
  experiments.forEach((experiment) => {
    Object.values(experiment.weeks).forEach((weekData) => {
      if (weekData.students) {
        weekData.students.forEach((student) => {
          if (!allStudents.has(student.rollNo)) {
            allStudents.set(student.rollNo, {
              rollNo: student.rollNo,
              studentName: student.studentName,
            });
          }
        });
      }
    });
  });

  const studentsList = Array.from(allStudents.values()).sort((a, b) =>
    a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }),
  );

  return (
    <div className="vat2-page">
      <header className="vat2-hero">
        <h1>View Practical Attendance - Batch {batch}</h1>
        <p>
          {studentsList.length} students and {weeks.length} weeks
        </p>
      </header>

      <section className="vat2-panel">
        {experiments.map((experiment, expIndex) => (
          <div key={`${experiment.exptNo}-${expIndex}`} className="mb-5">
            <h3 className="mb-3">
              Experiment {experiment.exptNo}: {experiment.exptName}
            </h3>

            <div className="vat2-table-wrapper">
              <table className="vat2-table">
                <thead>
                  <tr>
                    <th>ROLL NO.</th>
                    <th>NAME</th>
                    {weeks.map((week) => (
                      <th key={week}>
                        Week {week}
                        {experiment.weeks[week] && (
                          <>
                            <br />
                            <small>
                              {formatDate(experiment.weeks[week].actualDate)}
                            </small>
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((student) => (
                    <tr key={student.rollNo}>
                      <td>{student.rollNo}</td>
                      <td>{student.studentName || "N/A"}</td>
                      {weeks.map((week) => {
                        const weekData = experiment.weeks[week];
                        let studentStatus = "-";

                        if (weekData && weekData.students) {
                          const studentRecord = weekData.students.find(
                            (s) => s.rollNo === student.rollNo,
                          );
                          if (studentRecord) {
                            studentStatus =
                              studentRecord.status === "Present" ? "P" : "A";
                          }
                        }

                        return (
                          <td key={`${student.rollNo}-${week}`}>
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

            {/* Summary for this experiment */}
            <div className="mt-3">
              <h5>Summary:</h5>
              <div className="row">
                {weeks.map((week) => {
                  const weekData = experiment.weeks[week];
                  return weekData ? (
                    <div key={week} className="col-md-3 mb-2">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">Week {week}</h6>
                          <p className="card-text">
                            <strong>Date:</strong>{" "}
                            {formatDate(weekData.actualDate)}
                            <br />
                            <strong>Present:</strong> {weekData.presentCount}/
                            {weekData.studentsCount}
                            <br />
                            {weekData.remark && (
                              <>
                                <strong>Remark:</strong> {weekData.remark}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}

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

export default ViewPractical3;
