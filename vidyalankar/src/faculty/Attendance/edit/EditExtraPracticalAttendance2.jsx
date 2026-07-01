import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditAttendance2.css";

const EditExtraPracticalAttendance2 = ({ onAttendanceUpdated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCiaanId } = location.state || {};

  const [extraPracticalAttendance, setExtraPracticalAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validCiaanIds, setValidCiaanIds] = useState([]);

  useEffect(() => {
    const fetchValidCiaanIds = async () => {
      try {
        const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/Ciaans`);
        if (!response.ok) throw new Error("Failed to fetch CIAAN IDs");
        const Ciaans = await response.json();
        setValidCiaanIds(Ciaans.map((Ciaan) => Ciaan.CiaanId));
      } catch (err) {
        console.error("Error fetching valid CIAAN IDs:", err);
        setError("Could not load necessary course data.");
        setValidCiaanIds([]);
      }
    };
    fetchValidCiaanIds();
  }, []);

  useEffect(() => {
    if (validCiaanIds.length === 0) {
      if (!error) setIsLoading(true);
      return;
    }

    if (
      !selectedCiaanId ||
      !validCiaanIds.includes(parseInt(selectedCiaanId))
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
        const url = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/extra-pract?CiaanId=${selectedCiaanId}`;
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
  }, [selectedCiaanId, validCiaanIds, onAttendanceUpdated, error]);

  const handleEdit = (record) => {
    navigate("/edit-individual-extra-practical-attendance", {
      state: {
        recordToEdit: record,
        selectedCiaanId: selectedCiaanId,
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
          <span className="ea2-Ciaan-highlight">{selectedCiaanId}</span>
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
