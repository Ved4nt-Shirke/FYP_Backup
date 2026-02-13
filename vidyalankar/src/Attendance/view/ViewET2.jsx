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
    a.rollNo.localeCompare(b.rollNo)
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
    const ciannId = searchParams.get("ciannId");

    if (!ciannId) {
      setError("CIAAN ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchAttendanceData = async () => {
      try {
        // ✅ **CHANGE 1: Updated the API endpoint to fetch from the extra attendance route.**
        const response = await axios.get(
          `http://localhost:5000/api/extra-attendance/ciann/${ciannId}`
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
    return <p className="text-center p-4">Loading attendance details...</p>;
  }

  if (error) {
    return <p className="text-center text-danger p-4">{error}</p>;
  }

  if (!attendanceData || !attendanceData.students || attendanceData.students.length === 0) {
    return <p className="text-center p-4">No extra attendance data found for this CIAAN.</p>;
  }

  // Destructure from the transformed data
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
      {/* --- GREEN HEADER --- */}
      <header className="view-header">
        <h1>Extra Theory Attendance</h1>
      </header>
      
      <section className="attendance-section">

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="first-col">Roll No.</th>
                {dates.map((date, index) => (
                  <th key={index}>{formatDate(date)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.rollNo}>
                  <td className="first-col">{student.rollNo}</td>
                  {dates.map((date, index) => (
                    <td key={index}>
                      {/* This logic now works perfectly with the transformed data */}
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

export default ViewExtraTheory2;
