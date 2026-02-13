import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditAttendance2.css"; // Reusing the same CSS file

const EditExtraTheoryAttendance2 = ({ onAttendanceUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCiannId } = location.state || {};

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validCiannIds, setValidCiannIds] = useState([]);

  useEffect(() => {
    const fetchValidCiannIds = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/cianns");
        if (!response.ok) throw new Error("Failed to fetch CIANN IDs");
        const cianns = await response.json();
        setValidCiannIds(cianns.map(ciann => ciann.ciannId));
      } catch (err) {
        console.error("Error fetching valid CIANN IDs:", err);
        setError("Could not load necessary course data.");
        setValidCiannIds([]);
      }
    };
    fetchValidCiannIds();
  }, []);

  useEffect(() => {
    if (validCiannIds.length === 0) {
      if(!error) setIsLoading(true);
      return;
    }

    if (!selectedCiannId || !validCiannIds.includes(parseInt(selectedCiannId))) {
      setError(`Invalid or missing CIAAN ID. Please go back and select a valid course.`);
      setIsLoading(false);
      return;
    }

    const fetchAttendanceData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `http://localhost:5000/api/extra-attendance/ciann/${selectedCiannId}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
             setAttendanceRecords([]);
          } else {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }
        } else {
          const data = await response.json();
          setAttendanceRecords(data);
        }
      } catch (error) {
        console.error("Error fetching extra attendance data:", error);
        setError(error.message || "Failed to fetch extra attendance data.");
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedCiannId, validCiannIds, onAttendanceUpdated, error]);

  const handleEdit = (record) => {
    navigate('/edit-individual-extra-theory-attendance', {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };
  
  // Main render logic
  if (isLoading) return <div className="loading-message">Loading extra theory attendance records...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="edit-attendance-container">
      <h1 className="page-title">Edit Extra Theory Attendance (CIAAN ID: {selectedCiannId})</h1>
      
      {attendanceRecords.length === 0 ? (
        <div className="no-data-message">
          <p>No extra theory attendance records found for this course.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Date</th>
                <th>Total Students</th>
                <th>Present Count</th>
                <th>Absent Count</th>
                <th style={{ textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => {
                const presentCount = record.students?.filter(s => s.attendance === 'Present').length || 0;
                const absentCount = record.students?.filter(s => s.attendance === 'Absent').length || 0;
                const totalStudents = record.students?.length || 0;
                
                return (
                  <tr key={record._id}>
                    <td data-label="Topic">{record.topic || "N/A"}</td>
                    <td data-label="Date">{record.date || "N/A"}</td>
                    <td data-label="Total Students">{totalStudents}</td>
                    <td data-label="Present Count">{presentCount}</td>
                    <td data-label="Absent Count">{absentCount}</td>
                    <td data-label="Edit" style={{ textAlign: 'center' }}>
                      <button onClick={() => handleEdit(record)} className="edit-button">
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EditExtraTheoryAttendance2;
