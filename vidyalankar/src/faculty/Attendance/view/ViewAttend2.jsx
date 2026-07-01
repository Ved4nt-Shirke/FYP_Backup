import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewAttend2.css"; // <-- Your stylesheet

const ViewAttend2 = () => {
  // --- State Management ---
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  // --- Data Fetching ---
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const CiaanId = searchParams.get("CiaanId");

    if (!CiaanId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchAttendanceData = async () => {
      try {
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/attendance/${CiaanId}`,
        );
        setAttendanceData(response.data);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to fetch attendance data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [location.search]);

  // --- Event Handlers ---
  const handlePrint = () => {
    window.print();
  };

  // --- Render Logic ---
  if (loading) {
    return <div className="vat2-state">Loading attendance details...</div>;
  }

  if (error) {
    return <div className="vat2-state">{error}</div>;
  }

  if (
    !attendanceData ||
    !attendanceData.students ||
    attendanceData.students.length === 0
  ) {
    return (
      <div className="vat2-state">No attendance data found for this Ciaan.</div>
    );
  }

  const { students, dates } = attendanceData;

  // Helper to format date as DD-MM
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };

  return (
    <div className="vat2-page">
      <header className="vat2-hero">
        <h1>View Theory Attendance</h1>
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
                <tr key={student.rollNo}>
                  <td>{student.rollNo}</td>
                  <td>{student.studentName || "N/A"}</td>
                  {dates.map((date) => (
                    <td key={`${student.rollNo}-${date}`}>
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

export default ViewAttend2;
