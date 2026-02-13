import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditAttendance2.css";

const EditExtraPracticalAttendance2 = ({ onAttendanceUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCiannId } = location.state || {};

  const [extraPracticalAttendance, setExtraPracticalAttendance] = useState([]);
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
        // Fetch extra practical attendance records
        const url = `http://localhost:5000/api/extra-pract?ciannId=${selectedCiannId}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setExtraPracticalAttendance([]);
          } else {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }
        } else {
          const data = await response.json();
          setExtraPracticalAttendance(data);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError(error.message || "Failed to fetch attendance data.");
        setExtraPracticalAttendance([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedCiannId, validCiannIds, onAttendanceUpdated, error]);

  const handleEdit = (record) => {
    navigate('/edit-individual-extra-practical-attendance', {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };
  
  // Main render logic
  if (isLoading) return <div className="loading-message">Loading extra practical attendance records...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="edit-attendance-container">
      <h1 className="page-title">Edit Extra Practical Attendance (CIAAN ID: {selectedCiannId})</h1>
      
      {extraPracticalAttendance.length === 0 ? (
        <div className="no-data-message">
          <p>No extra practical attendance records found for this course.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Batch</th>
                <th>Experiments</th>
                <th>Total Students</th>
                <th>Present</th>
                <th>Absent</th>
                <th style={{ textAlign: 'center' }}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {extraPracticalAttendance.map((record) => {
                const presentCount = record.students?.filter(s => s.attendance === "Present").length || 0;
                const absentCount = record.students?.filter(s => s.attendance === "Absent").length || 0;
                
                return (
                  <tr key={record._id}>
                    <td data-label="Date">{record.actualDate || "N/A"}</td>
                    <td data-label="Batch">{record.batch || "N/A"}</td>
                    <td data-label="Experiments">
                      {Array.isArray(record.experiments) 
                        ? record.experiments.map(exp => `${exp.exptNo}: ${exp.exptName}`).join(', ')
                        : record.experiments || 'N/A'
                      }
                    </td>
                    <td data-label="Total Students">{record.students?.length || 0}</td>
                    <td data-label="Present">{presentCount}</td>
                    <td data-label="Absent">{absentCount}</td>
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

export default EditExtraPracticalAttendance2;
