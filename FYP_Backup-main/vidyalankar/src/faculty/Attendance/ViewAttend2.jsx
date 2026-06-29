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
    const ciannId = searchParams.get("ciannId");

    if (!ciannId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchAttendanceData = async () => {
      try {
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/attendance/${ciannId}`
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
    return <p className="text-center p-4">Loading attendance details...</p>;
  }

  if (error) {
    return <p className="text-center text-danger p-4">{error}</p>;
  }

  if (!attendanceData || !attendanceData.students || attendanceData.students.length === 0) {
    return <p className="text-center p-4">No attendance data found for this CIAAN.</p>;
  }
  
  const { students, dates } = attendanceData;

  // Helper to format date as DD-MM
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  return (
    <div className="course-diary-wrapper">
      <div className="header-bar bg-success text-white">
        {/* Changed title to be more specific */}
        <h2 className="text-center my-2 py-2">View Theory Attendance</h2>
      </div>
      <section className="attendance-section">

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="first-col">DATE</th>
                {dates.map((date) => (
                  <th key={date}>{formatDate(date)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td className="first-col">{student.rollNo}</td>
                  {dates.map((date) => (
                    <td key={`${student.rollNo}-${date}`}>
                      {student.attendance[date] === "Present" ? "P" : "A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
            <button className="btn btn-secondary" onClick={handlePrint}>
                Print
            </button>
        </div>
      </section>
    </div>
  );
};

export default ViewAttend2;
