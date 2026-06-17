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
        console.log(
          "Fetching tutorial attendance for CIANN ID:",
          selectedCiannId,
        );
        const response = await axios.get(
          `http://localhost:5000/api/tutorial-attendance?ciannId=${selectedCiannId}`,
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
        ciannId: selectedCiannId,
      },
    });
  };

  return (
    <div className="ea2-page">
      <div className="ea2-hero">
        <h1 className="ea2-hero-title">Edit Tutorial Attendance Records</h1>
        <p className="ea2-hero-subtitle">
          CIAAN ID:{" "}
          <span className="ea2-ciann-highlight">{selectedCiannId}</span>
        </p>
      </div>

      <div className="ea2-container">
        {loading && (
          <div className="ea2-state-container ea2-loading">
            <div className="ea2-spinner"></div>
            <p>Loading tutorial attendance records...</p>
          </div>
        )}

        {error && (
          <div className="ea2-state-container ea2-error">
            <i className="bi bi-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && tutorialRecords.length === 0 && (
          <div className="ea2-state-container ea2-no-data">
            <i className="bi bi-inbox"></i>
            <p>No tutorial attendance records found for this CIAAN.</p>
          </div>
        )}

        {!loading && !error && tutorialRecords.length > 0 && (
          <div className="ea2-list">
            {tutorialRecords.map((record, index) => {
              const presentCount =
                record.students?.filter((s) => s.attendance === "Present")
                  .length || 0;
              const absentCount =
                record.students?.filter((s) => s.attendance === "Absent")
                  .length || 0;
              const totalStudents = record.students?.length || 0;

              return (
                <div
                  key={record._id}
                  className="ea2-record-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="ea2-card-header">
                    <div className="ea2-chapter-badge">
                      <i className="bi bi-journals"></i>
                    </div>
                    <div className="ea2-card-title">
                      {record.Topic || "Tutorial Topic"}
                    </div>
                  </div>

                  <div className="ea2-card-content">
                    <div className="ea2-detail-grid">
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Date</span>
                        <span className="ea2-value">
                          {record.actualDate || "N/A"}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Subject</span>
                        <span className="ea2-value">
                          {record.subject?.name || "N/A"} (
                          {record.subject?.code || "-"})
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Division</span>
                        <span className="ea2-value">
                          {record.division || "N/A"}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Present / Absent</span>
                        <span className="ea2-value">
                          {presentCount} / {absentCount}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Students</span>
                        <span className="ea2-value">{totalStudents}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="ea2-edit-button"
                    onClick={() => handleEditClick(record)}
                  >
                    <i className="bi bi-pencil-square"></i>
                    Edit Record
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTutorialAttendance2;
