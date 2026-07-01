import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { showSuccessAlert, showErrorAlert } from "../../../utils/alertUtils.jsx";
import "./EditIndividualAttendance.css"; // Import the new CSS file

const EditIndividualAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordToEdit, selectedCiaanId } = location.state || {};

  const [formData, setFormData] = useState({
    _id: "",
    topic: "",
    date: "",
    remark: "",
    students: [],
    chapter: "",
    startDate: "",
    teachingMethod: "",
  });

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        _id: recordToEdit._id || "",
        topic: recordToEdit.topic || "",
        date: recordToEdit.date || "",
        remark: recordToEdit.remark || "",
        students: recordToEdit.students || [],
        chapter: recordToEdit.chapter || "",
        startDate: recordToEdit.startDate || "",
        teachingMethod: recordToEdit.teachingMethod || "",
      });
    } else {
      setMessage("Error: No attendance record provided for editing.");
      setIsSuccess(false);
    }
  }, [recordToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleStudentStatusChange = (rollNo) => {
    setFormData((prev) => ({
      ...prev,
      students: prev.students.map((student) =>
        student.rollNo === rollNo
          ? {
            ...student,
            status: student.status === "Present" ? "Absent" : "Present",
          }
          : student,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      if (!formData._id) {
        throw new Error("Record ID is missing. Cannot update.");
      }

      const payloadForBackend = {
        date: formData.date,
        remark: formData.remark,
        students: formData.students,
        topic: formData.topic,
      };

      // ✅ FIX: Corrected the URL to use a hyphen.
      const url = `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/api$/, "")}/api/theory-attendance/${formData._id}`;
      console.log(
        "Sending PUT request to:",
        url,
        "with payload:",
        payloadForBackend,
      );

      const response = await axios.put(url, payloadForBackend);

      if (response.status === 200) {
        showSuccessAlert("Theory attendance updated successfully!");
        setTimeout(() => {
          navigate("/edit-attendance2", {
            state: { selectedCiaanId: selectedCiaanId },
          });
        }, 1500);
      } else {
        throw new Error(
          response.data.message || `HTTP error! status: ${response.status}`,
        );
      }
    } catch (error) {
      showErrorAlert(
        `Error saving changes: ${error.response?.data?.message || error.message}`,
      );
      console.error("Error saving changes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!recordToEdit) {
    return (
      <div className="eia-error-page">
        <div className="eia-error-container">
          <i className="bi bi-exclamation-circle"></i>
          <h2>No Record Selected</h2>
          <p>Please go back to the attendance list to select a record.</p>
          <button
            onClick={() => navigate("/edit-attendance2")}
            className="eia-back-button"
          >
            ← Back to Records
          </button>
        </div>
      </div>
    );
  }

  const presentCount = formData.students
    ? formData.students.filter((student) => student.status === "Present").length
    : 0;
  const absentCount = formData.students
    ? formData.students.length - presentCount
    : 0;
  const totalCount = formData.students ? formData.students.length : 0;
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="eia-page">
      {/* Hero Section */}
      <div className="eia-hero">
        <h1 className="eia-hero-title">Edit Theory Attendance</h1>
        <p className="eia-hero-subtitle">
          Chapter {formData.chapter} • {formData.topic}
        </p>
      </div>

      {/* Main Container */}
      <div className="eia-container">
        {/* Error/Success Message */}
        {(message || isLoading) && (
          <div
            className={`eia-alert eia-alert-${isSuccess ? "success" : "error"}`}
          >
            <i
              className={`bi bi-${isSuccess ? "check-circle" : "x-circle"}`}
            ></i>
            {message}
          </div>
        )}

        {/* Context Card */}
        <div className="eia-context-card">
          <div className="eia-context-header">
            <span>Course Information</span>
          </div>
          <div className="eia-context-grid">
            <div className="eia-context-item">
              <span className="eia-context-label">Chapter</span>
              <span className="eia-context-value">
                {formData.chapter || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Topic</span>
              <span className="eia-context-value">
                {formData.topic || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Start Date</span>
              <span className="eia-context-value">
                {formData.startDate || "N/A"}
              </span>
            </div>
            <div className="eia-context-item">
              <span className="eia-context-label">Teaching Method</span>
              <span className="eia-context-value">
                {formData.teachingMethod || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="eia-stats-grid">
          <div className="eia-stat-card eia-stat-present">
            <div className="eia-stat-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{presentCount}</div>
              <div className="eia-stat-label">Present</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-absent">
            <div className="eia-stat-icon">
              <i className="bi bi-x-circle"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{absentCount}</div>
              <div className="eia-stat-label">Absent</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-total">
            <div className="eia-stat-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{totalCount}</div>
              <div className="eia-stat-label">Total</div>
            </div>
          </div>
          <div className="eia-stat-card eia-stat-percentage">
            <div className="eia-stat-icon">
              <i className="bi bi-percent"></i>
            </div>
            <div className="eia-stat-content">
              <div className="eia-stat-value">{attendancePercentage}%</div>
              <div className="eia-stat-label">Attendance</div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="eia-form">
          <div className="eia-form-grid">
            <div className="eia-form-group">
              <label htmlFor="date" className="eia-form-label">
                Date of Completion
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="eia-form-input"
                required
              />
            </div>

            <div className="eia-form-group">
              <label htmlFor="remark" className="eia-form-label">
                Remarks (Optional)
              </label>
              <textarea
                id="remark"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                className="eia-form-textarea"
                placeholder="Add any remarks about this lesson..."
                rows="3"
              ></textarea>
            </div>
          </div>

          {/* Students Attendance Section */}
          <div className="eia-students-section">
            <div className="eia-section-header">
              <h3>Mark Student Attendance</h3>
              <span className="eia-section-badge">{totalCount} students</span>
            </div>

            {formData.students && formData.students.length > 0 ? (
              <div className="eia-students-grid">
                {formData.students.map((student) => (
                  <div
                    key={student.rollNo}
                    className={`eia-student-card ${student.status === "Present" ? "eia-present" : "eia-absent"}`}
                    onClick={() => handleStudentStatusChange(student.rollNo)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="eia-student-header">
                      <div className="eia-student-roll">{student.rollNo}</div>
                      <button
                        type="button"
                        className={`status-pill status-toggle ${student.status === "Present" ? "present" : "absent"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStudentStatusChange(student.rollNo);
                        }}
                      >
                        {student.status}
                      </button>
                    </div>
                    <div className="eia-student-name">
                      {student.studentName}
                    </div>
                    <div className="eia-student-meta">
                      Enrollment: {student.enrollmentNo || "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="eia-no-students">
                <i className="bi bi-inbox"></i>
                <p>No students found for this course</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="eia-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/edit-attendance2", {
                  state: { selectedCiaanId: selectedCiaanId },
                })
              }
              className="eia-button eia-button-secondary"
              disabled={isLoading}
            >
              ← Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.students ||
                formData.students.length === 0
              }
              className="eia-button eia-button-primary"
            >
              {isLoading ? "Saving..." : "Update Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIndividualAttendance;
