import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showSuccessAlert, showErrorAlert } from "../../utils/alertUtils.jsx";
import "./EditAttendance2.css";

const EditPracticalAttendance2 = ({ onAttendanceUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCiannId } = location.state || {};

  const [practicalAttendance, setPracticalAttendance] = useState([]);
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
        // Fetch existing practical attendance records
        const practicalUrl = `http://localhost:5000/api/practical-attendance?ciannId=${selectedCiannId}`;
        const practicalResponse = await fetch(practicalUrl);

        if (!practicalResponse.ok) {
          if (practicalResponse.status === 404) {
            setPracticalAttendance([]);
          } else {
            const errorText = await practicalResponse.text();
            throw new Error(`HTTP error! status: ${practicalResponse.status} - ${errorText}`);
          }
        } else {
          const practicalData = await practicalResponse.json();
          setPracticalAttendance(practicalData);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError(error.message || "Failed to fetch attendance data.");
        setPracticalAttendance([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedCiannId, validCiannIds, onAttendanceUpdated, error]);

  const handleEditPractical = (record) => {
    navigate('/edit-existing-practical-attendance', {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };

  const handleDeletePractical = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this practical attendance record?\n\nWeek: ${record.weekNo}\nBatch: ${record.batch}\nExperiment: ${record.exptName}\nDate: ${record.actualDate}`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/practical-attendance/${record._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccessAlert('Practical attendance record deleted successfully!');
        // Refresh the data
        setPracticalAttendance(prev => prev.filter(r => r._id !== record._id));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting practical attendance:', error);
      showErrorAlert(`Failed to delete record: ${error.message}`);
    }
  };

  // Main render logic
  if (isLoading) return <div className="loading-message">Loading practical attendance records...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="edit-attendance-container">
      <h1 className="page-title">Edit Practical Attendance (CIAAN ID: {selectedCiannId})</h1>
      
      {practicalAttendance.length === 0 ? (
        <div className="no-data-message">
          <p>No practical attendance records found for this course.</p>
        </div>
      ) : (
        <>
          {/* Regular Practical Attendance Records Only */}
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Week No.</th>
                  <th>Batch</th>
                  <th>Experiment No.</th>
                  <th>Experiment Name</th>
                  <th>Date</th>
                  <th>Total Students</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {practicalAttendance.map((record) => {
                  const presentCount = record.students?.filter(s => s.status === "Present").length || 0;
                  const absentCount = record.students?.filter(s => s.status === "Absent").length || 0;
                  
                  return (
                    <tr key={record._id}>
                      <td data-label="Week No.">{record.weekNo || "N/A"}</td>
                      <td data-label="Batch">{record.batch || "N/A"}</td>
                      <td data-label="Experiment No.">{record.exptNo || "N/A"}</td>
                      <td data-label="Experiment Name">{record.exptName || "N/A"}</td>
                      <td data-label="Date">{record.actualDate || "N/A"}</td>
                      <td data-label="Total Students">{record.students?.length || 0}</td>
                      <td data-label="Present">{presentCount}</td>
                      <td data-label="Absent">{absentCount}</td>
                      <td data-label="Actions" style={{ textAlign: 'center' }}>
                        <button onClick={() => handleEditPractical(record)} className="edit-button" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDeletePractical(record)} className="delete-button" title="Delete" style={{ marginLeft: '5px' }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EditPracticalAttendance2;
