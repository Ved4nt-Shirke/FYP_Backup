import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../basic/Header";
import "./ExtraTheory.css";

const ExtraAttendance = () => {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const ciannData = location.state?.ciannData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ciannData) {
      alert("CIANN data not found. Please go back and select a CIANN.");
      return;
    }

    if (!topic.trim() || !date) {
      alert("Please fill in both topic and date.");
      return;
    }

    try {
      // Create the extra attendance record
      const response = await fetch(
        "http://localhost:5000/api/extra-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic.trim(),
            date,
            ciannId: ciannData.ciannId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create attendance record");
      }

      const attendanceRecord = await response.json();

      // Navigate to student attendance marking with the record ID
      navigate(`/student-extra-attendance/${attendanceRecord._id}`);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      alert("Failed to create attendance record. Please try again.");
    }
  };

  if (!ciannData) {
    return (
      <div>
        <Header />
        <div className="attendance-main-content">
          <div className="theory-attendance-container">
            <h3>No CIAAN selected. Please select a CIAAN card first.</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="attendance-main-content">
        <div className="theory-attendance-container">
          <div className="header-row">
            <h3>Mark Extra Theory Attendance</h3>
          </div>

          {ciannData && (
            <div className="ciann-info">
              <strong>CIANN ID:</strong> {ciannData.ciannId} |{" "}
              <strong>Subject:</strong> {ciannData.subject?.name} (
              {ciannData.subject?.code}) | <strong>Division:</strong>{" "}
              {ciannData.division}
            </div>
          )}

          <div className="form-wrapper">
            <form onSubmit={handleSubmit}>
              <div className="form-box">
                <div className="label-bar">Topics Covered</div>
                <div className="ea-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter topics covered"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-box">
                <div className="label-bar">Actual Date</div>
                <div className="ea-input-wrapper">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ea-submit-wrapper">
                <button type="submit" className="submit-btn">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraAttendance;
