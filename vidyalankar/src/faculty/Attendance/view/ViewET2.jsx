import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./ViewET2.css";

// --- Helper Function to Transform Data ---
// This function converts the API response (array of sessions) into the format the component needs to render the table.
const transformExtraAttendanceData = (records) => {
  if (!records || records.length === 0) {
    return { students: [], dates: [] };
  }

  const studentsMap = new Map();
  const datesSet = new Set();

  // 1. Loop through each attendance record (each is a separate lecture/date)
  records.forEach((record) => {
    if (record.date) {
      datesSet.add(record.date);
    }

    // 2. Loop through the students in that record
    record.students.forEach((student) => {
      // 3. If we haven't seen this student before, initialize them in our map
      if (!studentsMap.has(student.rollId)) {
        studentsMap.set(student.rollId, {
          rollNo: student.rollId,
          name: student.name,
          attendance: {},
        });
      }

      // 4. Get the student's entry and record their attendance for that specific date
      const studentData = studentsMap.get(student.rollId);
      if (record.date) {
        studentData.attendance[record.date] = student.attendance;
      }
    });
  });

  // 5. Convert the map of students and set of dates into sorted arrays
  const students = Array.from(studentsMap.values()).sort((a, b) =>
    a.rollNo.localeCompare(b.rollNo),
  );
  const dates = Array.from(datesSet).sort((a, b) => new Date(a) - new Date(b));

  return { students, dates };
};

const ViewExtraTheory2 = () => {
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
        // ✅ **CHANGE 1: Updated the API endpoint to fetch from the extra attendance route.**
        const response = await axios.get(
          `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-attendance/Ciaan/${CiaanId}`,
        );

        // ✅ **CHANGE 2: Transformed the data to fit the table structure.**
        const transformedData = transformExtraAttendanceData(response.data);
        setAttendanceData(transformedData);
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
      <div className="vat2-state">
        No extra attendance data found for this Ciaan.
      </div>
    );
  }

  // Destructure from the transformed data
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
        <h1>View Extra Theory Attendance</h1>
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
                {dates.map((date, index) => (
                  <th key={index}>{formatDate(date)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td>{student.rollNo}</td>
                  <td>{student.name || "N/A"}</td>
                  {dates.map((date, index) => (
                    <td key={index}>
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

export default ViewExtraTheory2;
