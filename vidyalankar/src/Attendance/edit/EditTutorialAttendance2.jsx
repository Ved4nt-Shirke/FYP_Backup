// EditTutorialAttendance2.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditAttendance2.css";

const EditTutorialAttendance2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCiannId } = location.state || {};
  
  const [tutorialRecords, setTutorialRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedCiannId) {
      setError("No CIAAN ID selected");
      setLoading(false);
      return;
    }

    const fetchTutorialAttendance = async () => {
      try {
        console.log("Fetching tutorial attendance for CIANN ID:", selectedCiannId);
        const response = await axios.get(
          `http://localhost:5000/api/tutorial-attendance?ciannId=${selectedCiannId}`
        );
        console.log("Tutorial attendance response:", response.data);
        setTutorialRecords(response.data);
      } catch (error) {
        console.error("Error fetching tutorial attendance:", error);
        setError("Failed to fetch tutorial attendance records");
      } finally {
        setLoading(false);
      }
    };

    fetchTutorialAttendance();
  }, [selectedCiannId]);

  const handleEditClick = (record) => {
    navigate("/edit-individual-tutorial-attendance", {
      state: {
        attendanceRecord: record,
        ciannId: selectedCiannId
      }
    });
  };

  if (loading) {
    return (
      <div className="edit-attendance-container">
        <div className="loading-message">Loading tutorial attendance records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-attendance-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="edit-attendance-container">
      <h1 className="page-title">Edit Tutorial Attendance - CIAAN ID: {selectedCiannId}</h1>
      
      {tutorialRecords.length === 0 ? (
        <div className="no-data-message">
          No tutorial attendance records found for this CIAAN.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Topic</th>
                <th>Subject</th>
                <th>Division</th>
                <th>Total Students</th>
                <th>Present Count</th>
                <th>Absent Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tutorialRecords.map((record) => {
                const presentCount = record.students?.filter(s => s.attendance === "Present").length || 0;
                const absentCount = record.students?.filter(s => s.attendance === "Absent").length || 0;
                const totalStudents = record.students?.length || 0;

                return (
                  <tr key={record._id}>
                    <td data-label="Date">{record.actualDate}</td>
                    <td data-label="Topic">{record.Topic}</td>
                    <td data-label="Subject">
                      {record.subject?.name} ({record.subject?.code})
                    </td>
                    <td data-label="Division">{record.division}</td>
                    <td data-label="Total Students">{totalStudents}</td>
                    <td data-label="Present Count">{presentCount}</td>
                    <td data-label="Absent Count">{absentCount}</td>
                    <td data-label="Actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEditClick(record)}
                      >
                        ✏️ Edit
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

export default EditTutorialAttendance2;
