import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewTut2.css";

const ViewT2 = () => {
  const [processedData, setProcessedData] = useState({ students: [], dates: [] });
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
          { params: { ciannId } }
        );
        const records = response.data;
        if (!records || records.length === 0) {
          setProcessedData({ students: [], dates: [] });
          return;
        }
        const studentData = {};
        const dateSet = new Set();
        records.forEach(record => {
          const recordDate = record.actualDate.split('T')[0];
          dateSet.add(recordDate);
          record.students.forEach(student => {
            if (!studentData[student.rollId]) {
              studentData[student.rollId] = {
                rollId: student.rollId,
                name: student.name,
                attendance: {}
              };
            }
            studentData[student.rollId].attendance[recordDate] = student.attendance;
          });
        });
        const sortedDates = Array.from(dateSet).sort();
        const studentArray = Object.values(studentData).sort((a, b) => a.rollId.localeCompare(b.rollId));
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
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}` : dateString;
  };

  if (loading) return <p className="status-message">Loading...</p>;
  if (error) return <p className="status-message error">{error}</p>;
  if (processedData.students.length === 0) return <p className="status-message">No data found.</p>;

  const { students, dates } = processedData;

  return (
    <div className="course-diary-wrapper">
      {/* --- GREEN HEADER --- */}
      <header className="view-header">
        <h1>Tutorial Attendance</h1>
      </header>

      <section className="attendance-section">
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="first-col">ROLL NO.</th>
                {dates.map(date => (
                  <th key={date}>{formatDate(date)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.rollId}>
                  <td className="first-col">{student.rollId}</td>
                  {dates.map(date => (
                    <td key={`${student.rollId}-${date}`}>
                      {student.attendance[date] === "Present" ? "P" : "A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <button className="btn" onClick={handlePrint}>
            Print
          </button>
        </div>
      </section>
    </div>
  );
};

export default ViewT2;
