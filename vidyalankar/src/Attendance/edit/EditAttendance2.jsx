import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditAttendance2.css"; // We will replace the content of this file

const EditAttendance2 = ({ onAttendanceUpdated }) => {
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
        const url = `http://localhost:5000/api/theory-attendance?ciannId=${selectedCiannId}`;
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
        console.error("Error fetching attendance data:", error);
        setError(error.message || "Failed to fetch attendance data.");
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedCiannId, validCiannIds, onAttendanceUpdated, error]);

  const handleEdit = (record) => {
    navigate('/edit-individual-attendance', {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };
  
  // Main render logic
  if (isLoading) return <div className="loading-message">Loading attendance records...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="edit-attendance-container">
      <h1 className="page-title">Edit Theory Attendance (CIAAN ID: {selectedCiannId})</h1>
      
      {attendanceRecords.length === 0 ? (
        <div className="no-data-message">
          <p>No attendance records found for this course.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Chapter No.</th>
                <th>Topics / Sub-topics</th>
                <th>Date of Commencing</th>
                <th>Date of Completion</th>
                <th>Teaching Method</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record._id}>
                  <td data-label="Chapter No.">{record.chapter || "N/A"}</td>
                  <td data-label="Topic">{record.topic || "N/A"}</td>
                  <td data-label="Start Date">{record.startDate || "N/A"}</td>
                  <td data-label="End Date">{record.date || "N/A"}</td>
                  <td data-label="Method">{record.teachingMethod || "N/A"}</td>
                  <td data-label="Remarks">{record.remark || "N/A"}</td>
                  <td data-label="Edit" style={{ textAlign: 'center' }}>
                    <button onClick={() => handleEdit(record)} className="edit-button">
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EditAttendance2;
