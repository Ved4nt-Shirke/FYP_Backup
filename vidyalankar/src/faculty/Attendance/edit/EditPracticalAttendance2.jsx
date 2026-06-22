import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showSuccessAlert, showErrorAlert } from "../../../utils/alertUtils.jsx";
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
        const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/cianns`);
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
        // Fetch existing practical attendance records
        const practicalUrl = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/practical-attendance?ciannId=${selectedCiannId}`;
        const practicalResponse = await fetch(practicalUrl);

        if (!practicalResponse.ok) {
          if (practicalResponse.status === 404) {
            setPracticalAttendance([]);
          } else {
            const errorText = await practicalResponse.text();
            throw new Error(
              `HTTP error! status: ${practicalResponse.status} - ${errorText}`,
            );
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
    navigate("/edit-existing-practical-attendance", {
      state: {
        recordToEdit: record,
        selectedCiannId: selectedCiannId,
      },
    });
  };

  const handleDeletePractical = async (record) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this practical attendance record?\n\nWeek: ${record.weekNo}\nBatch: ${record.batch}\nExperiment: ${record.exptName}\nDate: ${record.actualDate}`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/practical-attendance/${record._id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        showSuccessAlert("Practical attendance record deleted successfully!");
        // Refresh the data
        setPracticalAttendance((prev) =>
          prev.filter((r) => r._id !== record._id),
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting practical attendance:", error);
      showErrorAlert(`Failed to delete record: ${error.message}`);
    }
  };

  return (
    <div className="ea2-page">
      <div className="ea2-hero">
        <h1 className="ea2-hero-title">Edit Practical Attendance Records</h1>
        <p className="ea2-hero-subtitle">
          CIAAN ID:{" "}
          <span className="ea2-ciann-highlight">{selectedCiannId}</span>
        </p>
      </div>

      <div className="ea2-container">
        {isLoading && (
          <div className="ea2-state-container ea2-loading">
            <div className="ea2-spinner"></div>
            <p>Loading practical attendance records...</p>
          </div>
        )}

        {error && (
          <div className="ea2-state-container ea2-error">
            <i className="bi bi-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && practicalAttendance.length === 0 && (
          <div className="ea2-state-container ea2-no-data">
            <i className="bi bi-inbox"></i>
            <p>No practical attendance records found for this course.</p>
          </div>
        )}

        {!isLoading && !error && practicalAttendance.length > 0 && (
          <div className="ea2-list">
            {practicalAttendance.map((record, index) => {
              const presentCount =
                record.students?.filter((s) => s.status === "Present").length ||
                0;
              const absentCount =
                record.students?.filter((s) => s.status === "Absent").length ||
                0;

              return (
                <div
                  key={record._id}
                  className="ea2-record-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="ea2-card-header">
                    <div className="ea2-chapter-badge">
                      W{record.weekNo || "-"}
                    </div>
                    <div className="ea2-card-title">
                      Exp {record.exptNo || "-"}:{" "}
                      {record.exptName || "Untitled"}
                    </div>
                  </div>

                  <div className="ea2-card-content">
                    <div className="ea2-detail-grid">
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Batch</span>
                        <span className="ea2-value">
                          {record.batch || "N/A"}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Date</span>
                        <span className="ea2-value">
                          {record.actualDate || "N/A"}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Students</span>
                        <span className="ea2-value">
                          {record.students?.length || 0}
                        </span>
                      </div>
                      <div className="ea2-detail-item">
                        <span className="ea2-label">Present / Absent</span>
                        <span className="ea2-value">
                          {presentCount} / {absentCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleEditPractical(record)}
                      className="ea2-edit-button"
                      style={{ flex: 1 }}
                    >
                      <i className="bi bi-pencil-square"></i>
                      Edit Record
                    </button>
                    <button
                      onClick={() => handleDeletePractical(record)}
                      className="ea2-edit-button"
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #dc2626, #991b1b)",
                      }}
                    >
                      <i className="bi bi-trash3"></i>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPracticalAttendance2;
