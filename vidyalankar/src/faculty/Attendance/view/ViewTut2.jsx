import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewTut2.css";

const ViewT2 = () => {
  const [processedData, setProcessedData] = useState({
    students: [],
    dates: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Data fetching and processing logic (remains the same)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ciannId = searchParams.get("ciannId");

    if (!ciannId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchAndProcessData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/tutorial-attendance`,
          { params: { ciannId } },
        );
        const records = response.data;
        if (!records || records.length === 0) {
          setProcessedData({ students: [], dates: [] });
          return;
        }
        const studentData = {};
        const dateSet = new Set();
        records.forEach((record) => {
          const recordDate = record.actualDate.split("T")[0];
          dateSet.add(recordDate);
          record.students.forEach((student) => {
            if (!studentData[student.rollId]) {
              studentData[student.rollId] = {
                rollId: student.rollId,
                name: student.name,
                attendance: {},
              };
            }
            studentData[student.rollId].attendance[recordDate] =
              student.attendance;
          });
        });
        const sortedDates = Array.from(dateSet).sort();
        const studentArray = Object.values(studentData).sort((a, b) =>
          a.rollId.localeCompare(b.rollId),
        );
        setProcessedData({ students: studentArray, dates: sortedDates });
      } catch (err) {
        console.error("Error fetching or processing attendance data:", err);
        setError("Failed to fetch attendance data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessData();
  }, [location.search]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const parts = dateString.split("-");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}` : dateString;
  };

  if (loading)
    return <div className="vat2-state">Loading attendance details...</div>;
  if (error) return <div className="vat2-state">{error}</div>;
  if (processedData.students.length === 0) {
    return (
      <div className="vat2-state">
        No tutorial attendance data found for this CIANN.
      </div>
    );
  }

  const { students, dates } = processedData;

  return (
    <div className="vat2-page">
      <header className="vat2-hero">
        <h1>View Tutorial Attendance</h1>
        <p>
          {students.length} students and {dates.length} lecture dates
        </p>
      </header>

      <section className="vat2-panel">
        <div className="vat2-table-wrapper">
          <table className="vat2-table">
            <thead>
              <tr>
                <th>ROLL NO.</th>
                <th>NAME</th>
                {dates.map((date) => (
                  <th key={date}>{formatDate(date)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollId}>
                  <td>{student.rollId}</td>
                  <td>{student.name || "N/A"}</td>
                  {dates.map((date) => (
                    <td key={`${student.rollId}-${date}`}>
                      <span
                        className={
                          student.attendance[date] === "Present"
                            ? "vat2-status vat2-status--present"
                            : "vat2-status vat2-status--absent"
                        }
                      >
                        {student.attendance[date] === "Present" ? "P" : "A"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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

export default ViewT2;
