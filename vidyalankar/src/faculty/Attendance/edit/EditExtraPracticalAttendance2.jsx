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
        // Fetch extra practical attendance records
        const url = `http://localhost:5000/api/extra-pract?ciannId=${selectedCiannId}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            setExtraPracticalAttendance([]);
          } else {
            const errorText = await response.text();
            throw new Error(
              `HTTP error! status: ${response.status} - ${errorText}`,
            );
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
    navigate("/edit-individual-extra-practical-attendance", {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };

  return (
    <div className="ea2-page">
      <div className="ea2-hero">
        <h1 className="ea2-hero-title">
          Edit Extra Practical Attendance Records
        </h1>
        <p className="ea2-hero-subtitle">
          CIAAN ID:{" "}
          <span className="ea2-ciann-highlight">{selectedCiannId}</span>
        </p>
      </div>

      <div className="ea2-container">
        {isLoading && (
          <div className="ea2-state-container ea2-loading">
            <div className="ea2-spinner"></div>
            <p>Loading extra practical attendance records...</p>
          </div>
        )}

        {error && (
          <div className="ea2-state-container ea2-error">
            <i className="bi bi-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && extraPracticalAttendance.length === 0 && (
          <div className="ea2-state-container ea2-no-data">
            <i className="bi bi-inbox"></i>
            <p>No extra practical attendance records found for this course.</p>
          </div>
        )}

        {!isLoading && !error && extraPracticalAttendance.length > 0 && (
          <div className="ea2-list">
            {extraPracticalAttendance.map((record, index) => {
              const presentCount =
                record.students?.filter((s) => s.attendance === "Present")
                  .length || 0;
              const absentCount =
                record.students?.filter((s) => s.attendance === "Absent")
                  .length || 0;
              const experimentsText = Array.isArray(record.experiments)
                ? record.experiments
                    .map((exp) => `${exp.exptNo}: ${exp.exptName}`)
                    .join(", ")
                : record.experiments || "N/A";

              return (
                <div
                  key={record._id}
                  className="ea2-record-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="ea2-card-header">
                    <div className="ea2-chapter-badge">
                      {record.batch || "-"}
                    </div>
                    <div className="ea2-card-title">
                      Extra Practical Session
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
                        <span className="ea2-label">Experiments</span>
                        <span className="ea2-value">{experimentsText}</span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Present / Absent</span>
                        <span className="ea2-value">
                          {presentCount} / {absentCount}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Students</span>
                        <span className="ea2-value">
                          {record.students?.length || 0}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditExtraPracticalAttendance2;
