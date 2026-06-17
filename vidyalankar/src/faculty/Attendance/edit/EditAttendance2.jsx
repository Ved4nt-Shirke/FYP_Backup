import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditAttendance2.css";

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
        setValidCiannIds(cianns.map((ciann) => ciann.ciannId));
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
      if (!error) setIsLoading(true);
      return;
    }

    if (
      !selectedCiannId ||
      !validCiannIds.includes(parseInt(selectedCiannId))
    ) {
      setError(
        `Invalid or missing CIAAN ID. Please go back and select a valid course.`,
      );
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
            throw new Error(
              `HTTP error! status: ${response.status} - ${errorText}`,
            );
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
    navigate("/edit-individual-attendance", {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };

  // Main render logic
  if (isLoading)
    return <div className="loading-message">Loading attendance records...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="ea2-page">
      {/* Hero Section */}
      <div className="ea2-hero">
        <h1 className="ea2-hero-title">Edit Attendance Records</h1>
        <p className="ea2-hero-subtitle">
          CIAAN ID:{" "}
          <span className="ea2-ciann-highlight">{selectedCiannId}</span>
        </p>
      </div>

      {/* Container */}
      <div className="ea2-container">
        {/* Loading State */}
        {isLoading && (
          <div className="ea2-state-container ea2-loading">
            <div className="ea2-spinner"></div>
            <p>Loading attendance records...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="ea2-state-container ea2-error">
            <i className="bi bi-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !error && attendanceRecords.length === 0 && (
          <div className="ea2-state-container ea2-no-data">
            <i className="bi bi-inbox"></i>
            <p>No attendance records found for this course</p>
          </div>
        )}

        {/* Records List */}
        {!isLoading && !error && attendanceRecords.length > 0 && (
          <div className="ea2-list">
            {attendanceRecords.map((record, index) => (
              <div
                key={record._id}
                className="ea2-record-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="ea2-card-header">
                  <div className="ea2-chapter-badge">
                    {record.chapter || "N/A"}
                  </div>
                  <div className="ea2-card-title">
                    {record.topic || "Untitled"}
                  </div>
                </div>

                <div className="ea2-card-content">
                  <div className="ea2-detail-grid">
                    <div className="ea2-detail-item">
                      <span className="ea2-label">Start Date</span>
                      <span className="ea2-value">
                        {record.startDate || "N/A"}
                      </span>
                    </div>
                    <div className="ea2-detail-item">
                      <span className="ea2-label">End Date</span>
                      <span className="ea2-value">{record.date || "N/A"}</span>
                    </div>
                    <div className="ea2-detail-item">
                      <span className="ea2-label">Teaching Method</span>
                      <span className="ea2-value">
                        {record.teachingMethod || "N/A"}
                      </span>
                    </div>
                    <div className="ea2-detail-item">
                      <span className="ea2-label">Remarks</span>
                      <span className="ea2-value">
                        {record.remark || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(record)}
                  className="ea2-edit-button"
                >
                  <i className="bi bi-pencil-square"></i>
                  Edit Record
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditAttendance2;
