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
          `http://localhost:5000/api/view-practical-attendance/${ciannId}/${batch}`
        );
        setBatchAttendanceData(response.data);
      } catch (err) {
        console.error("Error fetching batch attendance data:", err);
        setError("Failed to fetch batch attendance data. Please try again later.");
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
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  // Render Logic
  if (loading) {
    return <p className="text-center p-4">Loading batch attendance details...</p>;
  }

  if (error) {
    return <p className="text-center text-danger p-4">{error}</p>;
  }

  if (!batchAttendanceData || !batchAttendanceData.experiments || batchAttendanceData.experiments.length === 0) {
    return <p className="text-center p-4">No attendance data found for this batch.</p>;
  }

  const { batch, weeks, experiments } = batchAttendanceData;

  // Get all unique students from all experiments
  const allStudents = new Map();
  experiments.forEach(experiment => {
    Object.values(experiment.weeks).forEach(weekData => {
      if (weekData.students) {
        weekData.students.forEach(student => {
          if (!allStudents.has(student.rollNo)) {
            allStudents.set(student.rollNo, {
              rollNo: student.rollNo,
              studentName: student.studentName
            });
          }
        });
      }
    });
  });

  const studentsList = Array.from(allStudents.values()).sort((a, b) => 
    a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })
  );

  return (
    <div className="course-diary-wrapper">
      {/* GREEN HEADER */}
      <header className="view-header">
        <h1>Practical Attendance - {batch}</h1>
      </header>
      
      <section className="attendance-section">
        {experiments.map((experiment, expIndex) => (
          <div key={`${experiment.exptNo}-${expIndex}`} className="mb-5">
            <h3 className="mb-3">
              Experiment {experiment.exptNo}: {experiment.exptName}
            </h3>
            
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th className="first-col">ROLL NO.</th>
                    {weeks.map((week) => (
                      <th key={week}>
                        Week {week}
                        {experiment.weeks[week] && (
                          <>
                            <br />
                            <small>{formatDate(experiment.weeks[week].actualDate)}</small>
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((student) => (
                    <tr key={student.rollNo}>
                      <td className="first-col">{student.rollNo}</td>
                      {weeks.map((week) => {
                        const weekData = experiment.weeks[week];
                        let studentStatus = '-';
                        
                        if (weekData && weekData.students) {
                          const studentRecord = weekData.students.find(s => s.rollNo === student.rollNo);
                          if (studentRecord) {
                            studentStatus = studentRecord.status === "Present" ? "P" : "A";
                          }
                        }
                        
                        return (
                          <td key={`${student.rollNo}-${week}`}>
                            {studentStatus}
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
                            <strong>Date:</strong> {formatDate(weekData.actualDate)}<br />
                            <strong>Present:</strong> {weekData.presentCount}/{weekData.studentsCount}<br />
                            {weekData.remark && (
                              <><strong>Remark:</strong> {weekData.remark}</>
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
        
        <div className="mt-4">
          <button className="btn btn-secondary" onClick={handlePrint}>
            Print
          </button>
        </div>
      </section>
    </div>
  );
};

export default ViewPractical3;
